import React from 'react'
import { render } from '@testing-library/react'
import Component from './component'

test('renders Topbar without crashing', () => {
    render(<Component />)
})
