import React from 'react'
import ProductsContainer from './ProductsContainer'
import CartContainer from './CartContainer'
// eslint-disable-next-line no-unused-vars
import styled from 'styled-components'

const App = () => (
  <div>
    <h2>Shopping Cart Example</h2>
    <hr/>
    <ProductsContainer />
    <hr/>
    <CartContainer />
  </div>
)

export default App
