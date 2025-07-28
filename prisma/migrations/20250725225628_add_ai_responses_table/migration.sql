-- CreateTable
CREATE TABLE "ai_responses" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "trigger_phrases" TEXT[],
    "response" TEXT NOT NULL,
    "tags" TEXT[],
    "auto_response" BOOLEAN NOT NULL DEFAULT true,
    "escalate_if_unclear" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_responses_pkey" PRIMARY KEY ("id")
);
