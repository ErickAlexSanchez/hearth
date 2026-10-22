import { Pool, type PoolClient, type QueryResultRow } from 'pg'

type Queryable = Pick<Pool | PoolClient, 'query'>

export async function queryRows<T extends QueryResultRow>(
  runner: Queryable,
  text: string,
  params: readonly unknown[] = [],
): Promise<{ rows: T[]; rowCount: number }> {
  const result = await runner.query<T>(text, [...params])
  return {
    rows: result.rows,
    rowCount: result.rowCount ?? 0,
  }
}
