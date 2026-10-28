from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import UserSerializer, RegisterSerializer
from .models import User


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserStatsView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        from courses.services import ProgressService
        from courses.models import Progress, Enrollment
        from submissions.models import Submission

        streak = ProgressService.calculate_streak(user)
        completed_lessons = Progress.objects.filter(user=user, is_completed=True).count()
        successful_submissions = Submission.objects.filter(user=user, status='success').count()
        enrolled_courses = Enrollment.objects.filter(user=user, is_active=True).count()

        data = {
            'username': user.username,
            'email': user.email,
            'role': getattr(user, 'role', 'student'),
            'groups': list(user.groups.values_list('name', flat=True)),
            'streak_days': streak,
            'completed_lessons': completed_lessons,
            'successful_submissions': successful_submissions,
            'enrolled_courses': enrolled_courses,
        }
        return Response(data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health(request):
    return Response({'status': 'ok'})
