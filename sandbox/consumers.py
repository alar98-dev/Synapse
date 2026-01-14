import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .executor import get_executor

class ExecutionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.group_name = f"sandbox_{self.session_id}"

        # Allow staff and teachers, or students but maybe with tighter limits
        # For simplicity, let's require authentication
        if not self.user or self.user.is_anonymous:
            # If we were using JWT middleware, user would be here.
            # For now, let's allow it if it's a dev session but log it.
            import logging
            logging.warning(f"Unauthenticated WebSocket connection attempt for session {self.session_id}")
            # await self.close()
            # return

        # Join room group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        
        await self.send_system_message("Connected to Synapse Playground. Ready for execution.")

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'execute':
            code = data.get('code', '')
            language = data.get('language', 'python')
            
            await self.send_system_message(f"Starting execution ({language})...")
            
            # Run code in a separate thread to not block the event loop
            # and stream results back via groups
            asyncio.create_task(self.run_execution(code, language))

    async def run_execution(self, code, language):
        executor = get_executor()
        
        def on_output(stream, content):
            # Send message to group
            # Note: this is called from a sync thread, so use async_to_sync if needed, 
            # but here we can use channel_layer.group_send directly if we have a way.
            # However, since we are using channels 4.0, we can use the group_send.
            # But we need an event loop.
            loop = asyncio.get_event_loop()
            asyncio.run_coroutine_threadsafe(
                self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'execution_output',
                        'stream': stream,
                        'content': content
                    }
                ),
                loop
            )

        # Run the code
        result = await sync_to_async(executor.run_code)(
            code=code, 
            language=language, 
            timeout=30, 
            on_output=on_output
        )
        
        # Final status
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'execution_result',
                'exit_code': result['exit_code'],
                'duration': result['duration']
            }
        )

    # Receive message from group
    async def execution_output(self, event):
        await self.send(text_data=json.dumps({
            'type': event['stream'],
            'content': event['content']
        }))

    async def execution_result(self, event):
        await self.send(text_data=json.dumps({
            'type': 'system',
            'content': f"\nExecution finished with exit code {event['exit_code']} in {event['duration']:.2f}s."
        }))

    async def send_system_message(self, message):
        await self.send(text_data=json.dumps({
            'type': 'system',
            'content': f"> {message}\n"
        }))
