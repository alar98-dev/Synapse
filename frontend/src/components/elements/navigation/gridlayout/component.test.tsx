import React from 'react'
import { render } from '@testing-library/react'
import Component from './component'

test('renders Gridlayout without crashing', () => {
    render(<Component />)
})
