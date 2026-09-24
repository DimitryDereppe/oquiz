-- CreateTable
CREATE TABLE
    "user" (
        "id" SERIAL NOT NULL,
        "email" VARCHAR(128) NOT NULL,
        "firstname" VARCHAR(128) NOT NULL,
        "lastname" VARCHAR(128) NOT NULL,
        "password" VARCHAR(256) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_pkey" PRIMARY KEY ("id")
    );

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user" ("email");