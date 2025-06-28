import React, { useEffect, useState } from 'react'

const SHOPIFY_DOMAIN = '3zh7af-rr.myshopify.com'
const STOREFRONT_ACCESS_TOKEN = 'bfcf6d6ecd54636afb3d31035c1e8df7'

export default function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-04/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN
        },
        body: JSON.stringify({
          query: `{
            products(first: 10) {
              edges {
                node {
                  id
                  title
                  description
                  images(first: 1) {
                    edges {
                      node {
                        url
                      }
                    }
                  }
                  variants(first: 1) {
                    edges {
                      node {
                        price {
                          amount
                        }
                        id
                      }
                    }
                  }
                }
              }
            }
          }`
        })
      })
      const result = await response.json()
      const items = result.data.products.edges.map(({ node }) => ({
        id: node.id,
        title: node.title,
        description: node.description,
        image: node.images.edges[0]?.node.url || '',
        price: parseFloat(node.variants.edges[0].node.price.amount),
        variantId: node.variants.edges[0].node.id,
      }))
      setProducts(items)
    }

    fetchProducts()
  }, [])

  const addToCart = (product) => {
    setCart(prev => {
      const found = prev.find(item => item.id === product.id)
      if (found) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const getTotal = () => cart.reduce((acc, item) => acc + item.price * item.qty, 0).toFixed(2)

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Shopify Storefront</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {products.map(product => (
          <div key={product.id} className='border p-4 rounded'>
            <img src={product.image} alt={product.title} className='w-full h-48 object-cover' />
            <h2 className='text-lg font-semibold'>{product.title}</h2>
            <p>{product.description}</p>
            <div className='flex justify-between items-center mt-2'>
              <span>${product.price}</span>
              <button onClick={() => addToCart(product)} className='px-3 py-1 bg-blue-600 text-white rounded'>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
      {cart.length > 0 && (
        <div className='mt-6 p-4 border rounded'>
          <h2 className='text-xl font-bold mb-2'>Cart</h2>
          {cart.map(item => (
            <div key={item.id} className='flex justify-between'>
              <span>{item.title} x {item.qty}</span>
              <span>${(item.qty * item.price).toFixed(2)}</span>
            </div>
          ))}
          <div className='font-bold mt-2'>Total: ${getTotal()}</div>
          <button
            className='mt-2 px-4 py-2 bg-green-600 text-white rounded'
            onClick={() =>
              window.open(
                `https://${SHOPIFY_DOMAIN}/cart/${cart
                  .map(item => item.variantId.split('/ProductVariant/')[1] + ':' + item.qty)
                  .join(',')}`,
                '_blank'
              )
            }
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}
