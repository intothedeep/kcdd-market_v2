-- ============================================================
-- BUG-12: junction 테이블에 누락된 RLS 정책 추가
-- ============================================================
-- 초기 마이그레이션이 3개 junction 테이블에 RLS를 ENABLE했지만
-- 어떤 POLICY도 만들지 않았음 → PostgreSQL 기본 동작 "모든 작업 거부"
-- → CBO가 새 request 제출 시 23514가 아닌 "violates RLS policy" 에러로 차단됨.
--
-- 영향 테이블:
--   - organization_cause_areas
--   - request_challenge_categories
--   - request_identity_categories
--
-- 정책 구조:
--   - SELECT: public (request/org detail 페이지에서 누구나 카테고리 표시)
--   - INSERT/UPDATE/DELETE: 해당 org/request의 owner CBO만
-- ============================================================

-- 1. organization_cause_areas
DROP POLICY IF EXISTS "Anyone can view organization cause areas" ON organization_cause_areas;
DROP POLICY IF EXISTS "Org owners can manage their cause areas" ON organization_cause_areas;

CREATE POLICY "Anyone can view organization cause areas"
  ON organization_cause_areas FOR SELECT
  USING (true);

CREATE POLICY "Org owners can manage their cause areas"
  ON organization_cause_areas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_cause_areas.organization_id
      AND user_id = public.clerk_user_id()
    )
  );

-- 2. request_challenge_categories
DROP POLICY IF EXISTS "Anyone can view request challenge categories" ON request_challenge_categories;
DROP POLICY IF EXISTS "Request owners can manage challenge categories" ON request_challenge_categories;

CREATE POLICY "Anyone can view request challenge categories"
  ON request_challenge_categories FOR SELECT
  USING (true);

CREATE POLICY "Request owners can manage challenge categories"
  ON request_challenge_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      INNER JOIN organizations o ON r.organization_id = o.id
      WHERE r.id = request_challenge_categories.request_id
      AND o.user_id = public.clerk_user_id()
    )
  );

-- 3. request_identity_categories
DROP POLICY IF EXISTS "Anyone can view request identity categories" ON request_identity_categories;
DROP POLICY IF EXISTS "Request owners can manage identity categories" ON request_identity_categories;

CREATE POLICY "Anyone can view request identity categories"
  ON request_identity_categories FOR SELECT
  USING (true);

CREATE POLICY "Request owners can manage identity categories"
  ON request_identity_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      INNER JOIN organizations o ON r.organization_id = o.id
      WHERE r.id = request_identity_categories.request_id
      AND o.user_id = public.clerk_user_id()
    )
  );
