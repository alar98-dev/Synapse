#!/usr/bin/env python3
"""
Apply a simple, consistent implementation to each generated element.

This script updates `component.tsx` and `styles.css` in each element folder
to a minimal, modern implementation that imports `../../_design.css`.

Run: python3 scripts/implement_elements.py
"""
import pathlib
import textwrap

BASE_DIR = pathlib.Path(__file__).resolve().parents[1]
TARGET_ROOT = BASE_DIR / "frontend" / "src" / "components" / "elements"


def pascal_from_kebab(s: str) -> str:
    parts = [p for p in s.split('-') if p]
    return ''.join(p.capitalize() for p in parts)


COMP_TEMPLATE = textwrap.dedent("""
    import React from 'react'
    import './styles.css'

    export interface __NAME__Props {
      className?: string
      children?: React.ReactNode
    }

    export const __NAME__: React.FC<__NAME__Props> = ({ className = '', children }) => {
      return (
        <div className={`syn-element __BASECLASS__ ${className}`}>
          <div className="syn-element__title">__NAME__</div>
          <div className="syn-element__body">__DESCRIPTION__</div>
          {children}
        </div>
      )
    }

    export default __NAME__
""")


STY_TEMPLATE = textwrap.dedent("""
    @import '../../_design.css';

    /* Component: __NAME__ */
    .syn-element.__BASECLASS__ {
      display: block;
      gap: 8px;
    }

    .syn-element.__BASECLASS__ .syn-element__title {
      font-size: 15px;
    }

    .syn-element.__BASECLASS__ .syn-element__body {
      margin-top: 6px;
    }
""")


def implement(folder: pathlib.Path):
    kebab = folder.name
    name = pascal_from_kebab(kebab)
    baseClass = f"syn-{kebab}"
    desc = f"{name} component — placeholder implementation."

    comp_path = folder / 'component.tsx'
    styles_path = folder / 'styles.css'

    comp_content = COMP_TEMPLATE.replace('__NAME__', name).replace('__DESCRIPTION__', desc).replace('__BASECLASS__', baseClass)
    styles_content = STY_TEMPLATE.replace('__NAME__', name).replace('__BASECLASS__', baseClass)

    comp_path.write_text(comp_content, encoding='utf-8')
    styles_path.write_text(styles_content, encoding='utf-8')


def main():
    if not TARGET_ROOT.exists():
        print('Target root not found:', TARGET_ROOT)
        return

    count = 0
    for category in TARGET_ROOT.iterdir():
        if not category.is_dir():
            continue
        for elem in category.iterdir():
            if not elem.is_dir():
                continue
            if (elem / 'component.tsx').exists():
                implement(elem)
                count += 1

    print('Implemented components:', count)


if __name__ == '__main__':
    main()
