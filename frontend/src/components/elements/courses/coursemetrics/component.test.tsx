import React from 'react'
import { render } from '@testing-library/react'
import Component from './component'

test('renders Coursemetrics without crashing', () => {
    render(<Component />)
})
