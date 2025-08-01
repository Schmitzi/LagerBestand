# LagerBestand

## Create item

```bash
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Widget A",
    "description": "Blue plastic widget",
    "quantity": 100,
    "location": "Warehouse A",
    "category": "Electronics",
    "sku": "WID-001",
    "price": 9.99,
    "supplier": "ACME Corp"
  }'
```
