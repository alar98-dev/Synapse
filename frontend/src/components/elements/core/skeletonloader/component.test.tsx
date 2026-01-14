import React from 'react'
import { render } from '@testing-library/react'
import Component from './component'

test('renders Skeletonloader without crashing', () => {
    render(<Component />)
})
