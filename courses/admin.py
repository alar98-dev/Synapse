from django.contrib import admin
from .models import Course, Cohort


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'level', 'is_published', 'price', 'created_at')
    prepopulated_fields = {'slug': ('title',)}


@admin.register(Cohort)
class CohortAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'start_date', 'end_date', 'capacity', 'enrollment_open')
    list_filter = ('course', 'enrollment_open')
