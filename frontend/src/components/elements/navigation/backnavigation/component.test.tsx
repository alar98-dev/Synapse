import React from 'react'
import { render } from '@testing-library/react'
import Component from './component'

test('renders Backnavigation without crashing', () => {
    render(<Component />)
})
