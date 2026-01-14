from rest_framework import serializers
from .models import Course, Cohort, Module, Lesson, Material, Enrollment, Progress, Certificate
from submissions.serializers import ProblemSerializer


class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = ['id', 'user', 'course', 'id_code', 'issued_at']
        read_only_fields = ['id_code', 'issued_at']


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name', 'file', 'created_at']


class LessonSerializer(serializers.ModelSerializer):
    materials = MaterialSerializer(many=True, read_only=True)
    problem = ProblemSerializer(read_only=True)
    
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'lesson_type', 'content', 'video_url', 'order', 'duration_minutes', 'materials', 'problem']


class EnrollmentSerializer(serializers.ModelSerializer):
    user_detail = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ['id', 'user', 'course', 'cohort', 'enrolled_at', 'is_active', 'user_detail']
        read_only_fields = ['user', 'enrolled_at', 'is_active']

    def get_user_detail(self, obj):
        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "email": obj.user.email,
            "role": getattr(obj.user, 'role', '')
        }


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'lessons']


class CohortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cohort
        fields = ['id', 'course', 'title', 'start_date', 'end_date', 'capacity', 'timezone', 'enrollment_open', 'created_at', 'updated_at']


class CourseSerializer(serializers.ModelSerializer):
    cohorts = CohortSerializer(many=True, read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    certificate = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'level', 'language', 
            'is_published', 'duration_hours', 'price', 'created_at', 
            'updated_at', 'cohorts', 'modules', 'enrolled_count', 'is_enrolled', 'certificate'
        ]

    def get_enrolled_count(self, obj):
        return Enrollment.objects.filter(course=obj).count()

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Enrollment.objects.filter(user=request.user, course=obj, is_active=True).exists()

    def get_certificate(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        cert = Certificate.objects.filter(user=request.user, course=obj).first()
        if cert:
            return CertificateSerializer(cert).data
        return None
