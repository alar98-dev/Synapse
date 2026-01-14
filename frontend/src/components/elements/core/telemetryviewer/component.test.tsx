import React from 'react'
import { render } from '@testing-library/react'
import Component from './component'

test('renders Telemetryviewer without crashing', () => {
    render(<Component />)
})
