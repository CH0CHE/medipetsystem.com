import { ProductService } from "./application/product.service";
import { productRepository } from "./infrastructure/product.repository";

export const productService = new ProductService(productRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { createProductSchema, type CreateProductInput } from "./application/dto/create-product.schema";
export { updateProductSchema, type UpdateProductInput } from "./application/dto/update-product.schema";
export { listProductsQuerySchema, type ListProductsQuery } from "./application/dto/list-products.schema";
export { registerMovementSchema, type RegisterMovementInput } from "./application/dto/register-movement.schema";
