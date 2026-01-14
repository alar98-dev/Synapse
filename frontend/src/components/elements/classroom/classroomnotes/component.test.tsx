import React from 'react'
import { render } from '@testing-library/react'
import Component from './component'

test('renders Classroomnotes without crashing', () => {
    render(<Component />)
})
