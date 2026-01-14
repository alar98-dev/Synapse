import React from 'react'
import { render } from '@testing-library/react'
import Component from './component'

test('renders Offlinedetector without crashing', () => {
    render(<Component />)
})
