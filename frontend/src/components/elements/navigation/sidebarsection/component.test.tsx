import React from 'react'
import { render } from '@testing-library/react'
import Component from './component'

test('renders Sidebarsection without crashing', () => {
    render(<Component />)
})
