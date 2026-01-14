import React from 'react'
import { render } from '@testing-library/react'
import Component from './component'

test('renders Authguard without crashing', () => {
    render(<Component />)
})
