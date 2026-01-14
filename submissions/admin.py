from django.contrib import admin
from .models import Problem, Submission


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'slug', 'created_at')
    prepopulated_fields = {'slug': ('title',)}


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'problem', 'user', 'status', 'created_at')
    readonly_fields = ('result_summary',)
