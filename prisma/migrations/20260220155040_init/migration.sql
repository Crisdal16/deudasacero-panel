-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "nif" TEXT,
    "rol" TEXT NOT NULL DEFAULT 'cliente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expediente" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "juzgado" TEXT,
    "tipoProcedimiento" TEXT NOT NULL DEFAULT 'persona_fisica',
    "faseActual" INTEGER NOT NULL DEFAULT 1,
    "porcentajeAvance" INTEGER NOT NULL DEFAULT 0,
    "fechaPresentacion" TIMESTAMP(3),
    "abogadoAsignado" TEXT,
    "notasInternas" TEXT,
    "situacionLaboral" TEXT,
    "buenaFe" BOOLEAN NOT NULL DEFAULT false,
    "sinAntecedentes" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deuda" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "importe" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "acreedor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ruta" TEXT,
    "contenido" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "esRequerido" BOOLEAN NOT NULL DEFAULT false,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "remitente" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "Expediente_referencia_key" ON "Expediente"("referencia");

-- CreateIndex
CREATE UNIQUE INDEX "Expediente_usuarioId_key" ON "Expediente"("usuarioId");

-- CreateIndex
CREATE INDEX "Expediente_referencia_idx" ON "Expediente"("referencia");

-- CreateIndex
CREATE INDEX "Expediente_faseActual_idx" ON "Expediente"("faseActual");

-- CreateIndex
CREATE INDEX "Deuda_expedienteId_idx" ON "Deuda"("expedienteId");

-- CreateIndex
CREATE INDEX "Deuda_tipo_idx" ON "Deuda"("tipo");

-- CreateIndex
CREATE INDEX "Documento_expedienteId_idx" ON "Documento"("expedienteId");

-- CreateIndex
CREATE INDEX "Documento_tipo_idx" ON "Documento"("tipo");

-- CreateIndex
CREATE INDEX "Documento_estado_idx" ON "Documento"("estado");

-- CreateIndex
CREATE INDEX "Mensaje_expedienteId_idx" ON "Mensaje"("expedienteId");

-- CreateIndex
CREATE INDEX "Mensaje_usuarioId_idx" ON "Mensaje"("usuarioId");

-- CreateIndex
CREATE INDEX "Mensaje_fechaEnvio_idx" ON "Mensaje"("fechaEnvio");

-- CreateIndex
CREATE INDEX "FAQ_orden_idx" ON "FAQ"("orden");

-- AddForeignKey
ALTER TABLE "Expediente" ADD CONSTRAINT "Expediente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deuda" ADD CONSTRAINT "Deuda_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
