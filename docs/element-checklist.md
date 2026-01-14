# Synapse — Element Checklist (150 elementos)

Use este checklist para garantir que cada elemento possui sua pasta e arquivos:

Formato alvo por elemento:

- frontend/src/components/elements/<categoria>/<element-name>/index.html
- frontend/src/components/elements/<categoria>/<element-name>/styles.css
- frontend/src/components/elements/<categoria>/<element-name>/component.tsx

- CORE / FUNDAÇÃO DO SPA (25)

- [x] AppShell
- [x] Router
- [x] ViewLoader
- [x] GlobalStateManager
- [x] SessionManager
- [x] AuthGuard
- [x] PermissionGuard
- [x] RoleResolver
- [x] APIClient
- [x] ErrorBoundary
- [x] GlobalErrorHandler
- [x] TelemetryEmitter
- [x] TelemetryViewer
- [x] FeatureFlagManager
- [x] ThemeManager
- [x] LayoutManager
- [x] ResponsiveManager
- [x] KeyboardShortcutManager
- [x] CacheLayer
- [x] OfflineDetector
- [x] NetworkStatusBanner
- [x] ToastManager
- [x] ModalManager
- [x] DrawerManager
- [x] SkeletonLoader

- NAVEGAÇÃO & LAYOUT (20)

- [x] Topbar
- [x] Sidebar
- [x] SidebarSection
- [x] SidebarItem
- [x] Breadcrumbs
- [x] ContextHeader
- [x] PageHeader
- [x] PageFooter
- [x] ScrollContainer
- [x] InfiniteScroll
- [x] TabNavigation
- [x] Accordion
- [x] SplitView
- [x] GridLayout
- [x] CardLayout
- [x] CommandPalette
- [x] SearchGlobal
- [x] QuickActions
- [x] BackNavigation
- [x] EmptyState

- CURSOS (20)

- [x] CourseList
- [x] CourseCard
- [x] CourseCreateForm
- [x] CourseEditForm
- [x] CourseCoverUploader
- [x] CourseStatusToggle
- [x] CourseSettings
- [x] CourseOverview
- [x] CourseMetrics
- [x] CoursePreview
- [x] CoursePublishFlow
- [x] CourseDraftManager
- [x] CourseDeleteConfirm
- [x] CourseClone
- [x] CourseCategories
- [x] CourseTags
- [x] CourseAccessRules
- [x] CourseVersionHistory
- [x] CourseAuditLog
- [x] CourseVisibilityControl

- AULAS & CAPÍTULOS (25)

- [x] LessonList
- [x] LessonCard
- [x] LessonCreateForm
- [x] LessonEditForm
- [x] LessonOrderDragDrop
- [x] LessonSettings
- [x] LessonPreview
- [x] ChapterList
- [x] ChapterCreate
- [x] ChapterEdit
- [x] ChapterReorder
- [x] ChapterVisibilityToggle
- [x] ChapterContentContainer
- [x] ChapterAutosave
- [x] ChapterVersioning
- [x] ChapterValidation
- [x] LessonCompletionRules
- [x] LessonPublishControl
- [x] LessonAccessTime
- [x] LessonAnalytics
- [x] LessonAuditLog
- [x] LessonClone
- [x] LessonDeleteConfirm
- [x] LessonStatusBadge
- [x] LessonContextSwitcher

- CONTEÚDO (TIPOS) (20)

- [x] RichTextEditor
- [x] MarkdownEditor
- [x] VideoPlayer
- [x] VideoUploader
- [x] PDFViewer
- [x] PDFUploader
- [x] LinkEmbed
- [x] ImageUploader
- [x] CodeBlockEditor
- [x] CodePreview
- [x] FileManager
- [x] ContentTypeSelector
- [x] ContentPlaceholder
- [x] ContentValidation
- [x] ContentAutosave
- [x] ContentPreview
- [x] ContentVisibilityControl
- [x] ContentLockIndicator
- [x] ContentAIHelper
- [x] ContentHistory

- MATERIAIS DE APOIO (10)

- [x] SupportMaterialList
- [x] SupportMaterialUploader
- [x] SupportMaterialCard
- [x] SupportMaterialPreview
- [x] SupportMaterialDelete
- [x] SupportMaterialVersioning
- [x] SupportMaterialDownload
- [x] SupportMaterialVisibility
- [x] SupportMaterialOrder
- [x] SupportMaterialAudit

- SALA DE AULA (10)

- [x] ClassroomLayout
- [x] ClassroomVideoArea
- [x] ClassroomChapterNavigator
- [x] ClassroomMaterialPanel
- [x] ClassroomNotes
- [x] ClassroomProgressBar
- [x] ClassroomFullscreenToggle
- [x] ClassroomInstructorView
- [x] ClassroomStudentPreview
- [x] ClassroomExitConfirm

- AVALIAÇÃO & IA (10)

- [x] AssessmentSessionPanel
- [x] AssessmentTurnViewer
- [x] AssessmentInputBox
- [x] AssessmentFeedback
- [x] AssessmentScoreIndicator
- [x] CognitiveDimensionsChart
- [x] CognitiveReportViewer
- [x] AssessmentConvergenceState
- [x] AssessmentRetryControl
- [x] AssessmentTelemetryInspector

- USUÁRIOS & PERFIL (10)

- [x] UserProfile
- [x] UserAvatarUploader
- [x] UserPreferences
- [x] RoleBadge
- [x] AccessDeniedView
- [x] UserActivityLog
- [x] UserNotificationCenter
- [x] UserSessionList
- [x] UserSecuritySettings
- [x] UserLogoutFlow

---

Como usar:

1. Rode `python3 scripts/generate_elements.py` para criar todos os scaffolds.
2. Depois de executar, marque os itens no checklist conforme revisa e implementa.
