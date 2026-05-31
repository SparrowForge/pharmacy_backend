import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const require = createRequire(import.meta.url);
const { AppModule } = require('../dist/app.module.js');

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const apiPrefix = process.env.API_PREFIX ?? 'api';
  const apiVersion = process.env.API_VERSION ?? 'v1';
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pharmacy Management API')
    .setDescription('Pharmacy backend API documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
        description: 'Enter JWT access token',
      },
      'bearer',
    )
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const outPath = path.join(process.cwd(), 'apidog', 'openapi.json');
  fs.writeFileSync(outPath, JSON.stringify(document, null, 2));

  await app.close();
  console.log(`OpenAPI generated: ${outPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
