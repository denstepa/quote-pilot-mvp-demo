-- CreateTable
CREATE TABLE "trucking_rates" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "base_price" DOUBLE PRECISION NOT NULL,
    "km_price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "notes" TEXT,
    "import_batch_id" TEXT,

    CONSTRAINT "trucking_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airport_rates" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "station_code" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "airline" TEXT,
    "export_handling" DOUBLE PRECISION,
    "export_customs" DOUBLE PRECISION,
    "import_handling" DOUBLE PRECISION,
    "import_customs" DOUBLE PRECISION,
    "currency" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "notes" TEXT,
    "import_batch_id" TEXT,

    CONSTRAINT "airport_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airline_rates" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "station_code" TEXT NOT NULL,
    "origin_country_code" TEXT NOT NULL,
    "destination_country_code" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "fuel_charge_per_kg" DOUBLE PRECISION NOT NULL,
    "base_price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "price_under_45kg" DOUBLE PRECISION,
    "price_under_100kg" DOUBLE PRECISION,
    "price_under_250kg" DOUBLE PRECISION,
    "price_under_300kg" DOUBLE PRECISION,
    "price_under_500kg" DOUBLE PRECISION,
    "price_under_1000kg" DOUBLE PRECISION,
    "price_over_1000kg" DOUBLE PRECISION,
    "notes" TEXT,
    "import_batch_id" TEXT,

    CONSTRAINT "airline_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_schedules" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "airline" TEXT NOT NULL,
    "flight_number" TEXT NOT NULL,
    "origin_code" TEXT NOT NULL,
    "destination_code" TEXT NOT NULL,
    "departure_time" TEXT,
    "arrival_time" TEXT,
    "monday" BOOLEAN NOT NULL DEFAULT false,
    "tuesday" BOOLEAN NOT NULL DEFAULT false,
    "wednesday" BOOLEAN NOT NULL DEFAULT false,
    "thursday" BOOLEAN NOT NULL DEFAULT false,
    "friday" BOOLEAN NOT NULL DEFAULT false,
    "saturday" BOOLEAN NOT NULL DEFAULT false,
    "sunday" BOOLEAN NOT NULL DEFAULT false,
    "departure_date" TIMESTAMP(3),
    "schedule_type" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "notes" TEXT,
    "import_batch_id" TEXT,

    CONSTRAINT "flight_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_name" TEXT NOT NULL,
    "sheet_name" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "processed_rows" INTEGER NOT NULL,
    "successful_rows" INTEGER NOT NULL,
    "error_rows" INTEGER NOT NULL,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trucking_rates_origin_destination_idx" ON "trucking_rates"("origin", "destination");

-- CreateIndex
CREATE INDEX "trucking_rates_region_idx" ON "trucking_rates"("region");

-- CreateIndex
CREATE INDEX "airport_rates_station_code_country_code_idx" ON "airport_rates"("station_code", "country_code");

-- CreateIndex
CREATE INDEX "airport_rates_airline_idx" ON "airport_rates"("airline");

-- CreateIndex
CREATE INDEX "airport_rates_region_idx" ON "airport_rates"("region");

-- CreateIndex
CREATE INDEX "airline_rates_station_code_origin_country_code_destination__idx" ON "airline_rates"("station_code", "origin_country_code", "destination_country_code");

-- CreateIndex
CREATE INDEX "airline_rates_airline_idx" ON "airline_rates"("airline");

-- CreateIndex
CREATE INDEX "flight_schedules_airline_flight_number_idx" ON "flight_schedules"("airline", "flight_number");

-- CreateIndex
CREATE INDEX "flight_schedules_origin_code_destination_code_idx" ON "flight_schedules"("origin_code", "destination_code");

-- CreateIndex
CREATE INDEX "flight_schedules_carrier_idx" ON "flight_schedules"("carrier");

-- AddForeignKey
ALTER TABLE "trucking_rates" ADD CONSTRAINT "trucking_rates_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "airport_rates" ADD CONSTRAINT "airport_rates_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "airline_rates" ADD CONSTRAINT "airline_rates_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_schedules" ADD CONSTRAINT "flight_schedules_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
