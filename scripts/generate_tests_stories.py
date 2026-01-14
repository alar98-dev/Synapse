#!/usr/bin/env python3
"""
Generate basic unit test and Storybook story files for each component scaffold

Run: python3 scripts/generate_tests_stories.py

It walks `frontend/src/components/elements/*/*` and creates:
- `component.test.tsx` — basic RTL render smoke test
- `component.stories.tsx` — basic Storybook story
"""
import pathlib
import textwrap
from typing import Tuple

BASE_DIR = pathlib.Path(__file__).resolve().parents[1]
TARGET_ROOT = BASE_DIR / "frontend" / "src" / "components" / "elements"


def pascal_from_kebab(s: str) -> str:
    parts = [p for p in s.split('-') if p]
    return ''.join(p.capitalize() for p in parts)


TEST_TEMPLATE = textwrap.dedent("""\
        import React from 'react'
        import { render } from '@testing-library/react'
        import Component from './component'

        test('renders __DISPLAY__ without crashing', () => {
            render(<Component />)
        })
""")


STORY_TEMPLATE = textwrap.dedent("""\
        import React from 'react'
        import Component from './component'

        export default {
            title: 'Elements/__CATEGORY__/__DISPLAY__',
            component: Component,
        }

        export const Default = () => <Component />
""")


def create_files(folder: pathlib.Path) -> Tuple[bool, bool]:
    """Creates test and story if not present. Returns tuple (test_created, story_created)."""
    test_path = folder / 'component.test.tsx'
    story_path = folder / 'component.stories.tsx'
    kebab = folder.name
    display = pascal_from_kebab(kebab)
    category = folder.parent.name

    created_test = False
    created_story = False

    if not test_path.exists():
        test_path.write_text(TEST_TEMPLATE.replace('__DISPLAY__', display), encoding='utf-8')
        created_test = True

    if not story_path.exists():
        story_path.write_text(STORY_TEMPLATE.replace('__CATEGORY__', category).replace('__DISPLAY__', display), encoding='utf-8')
        created_story = True

    return created_test, created_story


def main():
    if not TARGET_ROOT.exists():
        print('Target root not found:', TARGET_ROOT)
        return

    total_folders = 0
    tests_created = 0
    stories_created = 0

    for category in TARGET_ROOT.iterdir():
        if not category.is_dir():
            continue
        for elem in category.iterdir():
            if not elem.is_dir():
                continue
            # Only consider folders that contain a component.tsx
            if (elem / 'component.tsx').exists():
                total_folders += 1
                t, s = create_files(elem)
                if t:
                    tests_created += 1
                if s:
                    stories_created += 1

    print(f'Folders scanned: {total_folders}')
    print(f'Tests created: {tests_created}')
    print(f'Stories created: {stories_created}')


if __name__ == '__main__':
    main()
