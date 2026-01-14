#!/usr/bin/env python3
"""
Generator script to create a folder-per-element scaffold for the Synapse frontend

Run: python3 scripts/generate_elements.py

It will create folders under `frontend/src/components/elements/<category>/<element>/`
with `index.html`, `styles.css`, and `component.tsx` placeholders.
"""
import os
import pathlib
import textwrap

BASE_DIR = pathlib.Path(__file__).resolve().parents[1]
TARGET_ROOT = BASE_DIR / "frontend" / "src" / "components" / "elements"

ELEMENTS = {
    "core": [
        "AppShell",
        "Router",
        "ViewLoader",
        "GlobalStateManager",
        "SessionManager",
        "AuthGuard",
        "PermissionGuard",
        "RoleResolver",
        "APIClient",
        "ErrorBoundary",
        "GlobalErrorHandler",
        "TelemetryEmitter",
        "TelemetryViewer",
        "FeatureFlagManager",
        "ThemeManager",
        "LayoutManager",
        "ResponsiveManager",
        "KeyboardShortcutManager",
        "CacheLayer",
        "OfflineDetector",
        "NetworkStatusBanner",
        "ToastManager",
        "ModalManager",
        "DrawerManager",
        "SkeletonLoader",
    ],
    "navigation": [
        "Topbar",
        "Sidebar",
        "SidebarSection",
        "SidebarItem",
        "Breadcrumbs",
        "ContextHeader",
        "PageHeader",
        "PageFooter",
        "ScrollContainer",
        "InfiniteScroll",
        "TabNavigation",
        "Accordion",
        "SplitView",
        "GridLayout",
        "CardLayout",
        "CommandPalette",
        "SearchGlobal",
        "QuickActions",
        "BackNavigation",
        "EmptyState",
    ],
    "courses": [
        "CourseList",
        "CourseCard",
        "CourseCreateForm",
        "CourseEditForm",
        "CourseCoverUploader",
        "CourseStatusToggle",
        "CourseSettings",
        "CourseOverview",
        "CourseMetrics",
        "CoursePreview",
        "CoursePublishFlow",
        "CourseDraftManager",
        "CourseDeleteConfirm",
        "CourseClone",
        "CourseCategories",
        "CourseTags",
        "CourseAccessRules",
        "CourseVersionHistory",
        "CourseAuditLog",
        "CourseVisibilityControl",
    ],
    "lessons": [
        "LessonList",
        "LessonCard",
        "LessonCreateForm",
        "LessonEditForm",
        "LessonOrderDragDrop",
        "LessonSettings",
        "LessonPreview",
        "ChapterList",
        "ChapterCreate",
        "ChapterEdit",
        "ChapterReorder",
        "ChapterVisibilityToggle",
        "ChapterContentContainer",
        "ChapterAutosave",
        "ChapterVersioning",
        "ChapterValidation",
        "LessonCompletionRules",
        "LessonPublishControl",
        "LessonAccessTime",
        "LessonAnalytics",
        "LessonAuditLog",
        "LessonClone",
        "LessonDeleteConfirm",
        "LessonStatusBadge",
        "LessonContextSwitcher",
    ],
    "content_types": [
        "RichTextEditor",
        "MarkdownEditor",
        "VideoPlayer",
        "VideoUploader",
        "PDFViewer",
        "PDFUploader",
        "LinkEmbed",
        "ImageUploader",
        "CodeBlockEditor",
        "CodePreview",
        "FileManager",
        "ContentTypeSelector",
        "ContentPlaceholder",
        "ContentValidation",
        "ContentAutosave",
        "ContentPreview",
        "ContentVisibilityControl",
        "ContentLockIndicator",
        "ContentAIHelper",
        "ContentHistory",
    ],
    "support_materials": [
        "SupportMaterialList",
        "SupportMaterialUploader",
        "SupportMaterialCard",
        "SupportMaterialPreview",
        "SupportMaterialDelete",
        "SupportMaterialVersioning",
        "SupportMaterialDownload",
        "SupportMaterialVisibility",
        "SupportMaterialOrder",
        "SupportMaterialAudit",
    ],
    "classroom": [
        "ClassroomLayout",
        "ClassroomVideoArea",
        "ClassroomChapterNavigator",
        "ClassroomMaterialPanel",
        "ClassroomNotes",
        "ClassroomProgressBar",
        "ClassroomFullscreenToggle",
        "ClassroomInstructorView",
        "ClassroomStudentPreview",
        "ClassroomExitConfirm",
    ],
    "assessment_ai": [
        "AssessmentSessionPanel",
        "AssessmentTurnViewer",
        "AssessmentInputBox",
        "AssessmentFeedback",
        "AssessmentScoreIndicator",
        "CognitiveDimensionsChart",
        "CognitiveReportViewer",
        "AssessmentConvergenceState",
        "AssessmentRetryControl",
        "AssessmentTelemetryInspector",
    ],
    "users_profile": [
        "UserProfile",
        "UserAvatarUploader",
        "UserPreferences",
        "RoleBadge",
        "AccessDeniedView",
        "UserActivityLog",
        "UserNotificationCenter",
        "UserSessionList",
        "UserSecuritySettings",
        "UserLogoutFlow",
    ],
}


def kebab(s: str) -> str:
    out = []
    for ch in s:
        if ch.isalnum():
            out.append(ch.lower())
        else:
            out.append('-')
    res = ''.join(out)
    # collapse multiple dashes
    while '--' in res:
        res = res.replace('--', '-')
    res = res.strip('-')
    return res


HTML_TEMPLATE = textwrap.dedent("""
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link rel="stylesheet" href="styles.css" />
      <title>{name}</title>
    </head>
    <body>
      <div id="{id}">{name} placeholder</div>
    </body>
    </html>
""")


CSS_TEMPLATE = textwrap.dedent("""
    /* Styles for {name} */
    :root {{
      --{id}-bg: #f7f7f8;
    }}
    #{id} {{
      background: var(--{id}-bg);
      padding: 12px;
      border-radius: 6px;
      font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
    }}
""")


TSX_TEMPLATE = textwrap.dedent("""
    import React from 'react'

    export interface {name}Props {{
      className?: string
    }}

    export const {name}: React.FC<{name}Props> = ({{ className }}) => {{
            return (
                <div className={{className}} data-element="{id}">{name} placeholder</div>
            )
    }}

    export default {name}
""")


def ensure(path: pathlib.Path):
    path.parent.mkdir(parents=True, exist_ok=True)


def create_element(category: str, name: str):
    folder = TARGET_ROOT / category / kebab(name)
    ensure(folder / 'index.html')
    idname = f"syn-{kebab(category)}-{kebab(name)}"
    with open(folder / 'index.html', 'w', encoding='utf-8') as f:
        f.write(HTML_TEMPLATE.format(name=name, id=idname))
    with open(folder / 'styles.css', 'w', encoding='utf-8') as f:
        f.write(CSS_TEMPLATE.format(name=name, id=idname))
    # TSX component names must be valid identifiers
    comp_name = ''.join(ch for ch in name if ch.isalnum())
    with open(folder / 'component.tsx', 'w', encoding='utf-8') as f:
        f.write(TSX_TEMPLATE.format(name=comp_name, id=idname))


def main():
    print('Target root:', TARGET_ROOT)
    for category, items in ELEMENTS.items():
        for it in items:
            create_element(category, it)
    print('Scaffold created. Review files under:', TARGET_ROOT)


if __name__ == '__main__':
    main()
