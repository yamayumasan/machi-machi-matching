-- AlterEnum: NEXT_WEEK → TODAY
-- Step 1: 既存の NEXT_WEEK データを THIS_WEEK に変換
UPDATE "WantToDo" SET "timing" = 'THIS_WEEK' WHERE "timing" = 'NEXT_WEEK';

-- Step 2: enum を更新（NEXT_WEEK を削除し、TODAY を追加）
-- PostgreSQL では直接 enum を変更できないため、以下の手順で行う

-- 新しい enum 型を作成
CREATE TYPE "Timing_new" AS ENUM ('TODAY', 'THIS_WEEK', 'THIS_MONTH', 'ANYTIME');

-- デフォルト値を一時的に削除
ALTER TABLE "WantToDo" ALTER COLUMN "timing" DROP DEFAULT;

-- カラムの型を変更
ALTER TABLE "WantToDo" ALTER COLUMN "timing" TYPE "Timing_new" USING ("timing"::text::"Timing_new");

-- デフォルト値を再設定
ALTER TABLE "WantToDo" ALTER COLUMN "timing" SET DEFAULT 'ANYTIME'::"Timing_new";

-- 古い enum 型を削除
DROP TYPE "Timing";

-- 新しい enum 型をリネーム
ALTER TYPE "Timing_new" RENAME TO "Timing";
