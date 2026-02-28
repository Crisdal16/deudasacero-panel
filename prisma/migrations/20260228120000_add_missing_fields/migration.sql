-- Migration: Add missing fields to existing tables

-- Add fields to Mensaje table
ALTER TABLE "Mensaje" ADD COLUMN IF NOT EXISTS "destinatario" TEXT;
ALTER TABLE "Mensaje" ADD COLUMN IF NOT EXISTS "archivoNombre" TEXT;
ALTER TABLE "Mensaje" ADD COLUMN IF NOT EXISTS "archivoContenido" TEXT;
ALTER TABLE "Mensaje" ADD COLUMN IF NOT EXISTS "archivoTipo" TEXT;

-- Add index for destinatario
CREATE INDEX IF NOT EXISTS "Mensaje_destinatario_idx" ON "Mensaje"("destinatario");

-- Add fields to Documento table
ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS "nombreArchivo" TEXT;
ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS "esJudicial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS "fase" INTEGER;
ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS "subidoPorId" TEXT;
ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS "notas" TEXT;

-- Add index and FK for subidoPorId
CREATE INDEX IF NOT EXISTS "Documento_fase_idx" ON "Documento"("fase");
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add fields to Usuario table
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "apellidos" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "activo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "ultimoAcceso" TIMESTAMP(3);
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "direccion" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "codigoPostal" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "ciudad" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "provincia" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "nombreFacturacion" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "nifFacturacion" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "direccionFacturacion" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "numeroColegiado" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "emailVerificado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "tokenVerificacion" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "tokenVerificacionExpira" TIMESTAMP(3);

-- Add index for activo
CREATE INDEX IF NOT EXISTS "Usuario_activo_idx" ON "Usuario"("activo");

-- Migrate Expediente: Rename usuarioId to clienteId
ALTER TABLE "Expediente" RENAME COLUMN "usuarioId" TO "clienteId";

-- Update FK name
ALTER TABLE "Expediente" DROP CONSTRAINT IF EXISTS "Expediente_usuarioId_fkey";
ALTER TABLE "Expediente" ADD CONSTRAINT "Expediente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new fields to Expediente
ALTER TABLE "Expediente" ADD COLUMN IF NOT EXISTS "abogadoAsignadoId" TEXT;
ALTER TABLE "Expediente" ADD COLUMN IF NOT EXISTS "estadoCivil" TEXT;
ALTER TABLE "Expediente" ADD COLUMN IF NOT EXISTS "hijos" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Expediente" ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL DEFAULT 'activo';
ALTER TABLE "Expediente" ADD COLUMN IF NOT EXISTS "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Expediente" ADD COLUMN IF NOT EXISTS "fechaCierre" TIMESTAMP(3);
ALTER TABLE "Expediente" ADD COLUMN IF NOT EXISTS "notasPublicas" TEXT;

-- Add FK for abogadoAsignadoId
ALTER TABLE "Expediente" ADD CONSTRAINT "Expediente_abogadoAsignadoId_fkey" FOREIGN KEY ("abogadoAsignadoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS "Expediente_estado_idx" ON "Expediente"("estado");
CREATE INDEX IF NOT EXISTS "Expediente_clienteId_idx" ON "Expediente"("clienteId");
CREATE INDEX IF NOT EXISTS "Expediente_abogadoAsignadoId_idx" ON "Expediente"("abogadoAsignadoId");

-- Drop unique constraint on Expediente.usuarioId (now clienteId) if it exists
ALTER TABLE "Expediente" DROP CONSTRAINT IF EXISTS "Expediente_usuarioId_key";
DROP INDEX IF EXISTS "Expediente_usuarioId_key";
