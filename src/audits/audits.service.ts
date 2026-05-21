import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { ListAuditsQueryDto } from './dto/list-audits-query.dto';

type AuditLogRow = QueryResultRow & {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: unknown;
  new_values: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

@Injectable()
export class AuditsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAudits(query: ListAuditsQueryDto) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const filters: string[] = [];
    const params: unknown[] = [];

    if (query.action) {
      params.push(query.action);
      filters.push(`action = $${params.length}`);
    }

    if (query.resource) {
      params.push(query.resource);
      filters.push(`entity_type = $${params.length}`);
    }

    if (query.userId) {
      params.push(query.userId);
      filters.push(`user_id = $${params.length}::uuid`);
    }

    if (query.from) {
      params.push(query.from);
      filters.push(`created_at >= $${params.length}::timestamptz`);
    }

    if (query.to) {
      params.push(query.to);
      filters.push(`created_at <= $${params.length}::timestamptz`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM phar_audit_logs
      ${whereClause}
    `;

    const dataQuery = `
      SELECT
        id, user_id, action, entity_type, entity_id, old_values, new_values,
        ip_address, user_agent, created_at
      FROM phar_audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    const countResult = await this.databaseService.query<{ total: number }>(
      countQuery,
      params,
    );

    const dataResult = await this.databaseService.query<AuditLogRow>(dataQuery, [
      ...params,
      limit,
      offset,
    ]);

    return {
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      data: dataResult.rows.map((row) => this.mapAuditRow(row)),
    };
  }

  async getAuditById(id: string) {
    const result = await this.databaseService.query<AuditLogRow>(
      `
      SELECT
        id, user_id, action, entity_type, entity_id, old_values, new_values,
        ip_address, user_agent, created_at
      FROM phar_audit_logs
      WHERE id = $1::uuid
      LIMIT 1
    `,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException(`Audit log not found for id: ${id}`);
    }

    return this.mapAuditRow(result.rows[0]);
  }

  async cleanupOldAudits(olderThanDays: number) {
    const result = await this.databaseService.query(
      `
      DELETE FROM phar_audit_logs
      WHERE created_at < now() - make_interval(days => $1::int)
    `,
      [olderThanDays],
    );

    return {
      message: 'Old audit logs cleaned up',
      olderThanDays,
      deletedCount: result.rowCount ?? 0,
    };
  }

  async getAuditsByResource(resource: string, page = 1, limit = 20) {
    return this.getAudits({
      page,
      limit,
      resource,
    });
  }

  async getAuditsByUser(userId: string, page = 1, limit = 20) {
    return this.getAudits({
      page,
      limit,
      userId,
    });
  }

  async getAuditStats() {
    const summaryResult = await this.databaseService.query<{
      total_logs: number;
      unique_users: number;
      unique_resources: number;
      last_log_at: string | null;
    }>(`
      SELECT
        COUNT(*)::int AS total_logs,
        COUNT(DISTINCT user_id)::int AS unique_users,
        COUNT(DISTINCT entity_type)::int AS unique_resources,
        MAX(created_at) AS last_log_at
      FROM phar_audit_logs
    `);

    const actionsResult = await this.databaseService.query<{
      action: string;
      count: number;
    }>(`
      SELECT action, COUNT(*)::int AS count
      FROM phar_audit_logs
      GROUP BY action
      ORDER BY count DESC, action ASC
    `);

    const resourcesResult = await this.databaseService.query<{
      resource: string | null;
      count: number;
    }>(`
      SELECT entity_type AS resource, COUNT(*)::int AS count
      FROM phar_audit_logs
      GROUP BY entity_type
      ORDER BY count DESC, resource ASC NULLS LAST
    `);

    return {
      summary: summaryResult.rows[0] ?? {
        total_logs: 0,
        unique_users: 0,
        unique_resources: 0,
        last_log_at: null,
      },
      byAction: actionsResult.rows,
      byResource: resourcesResult.rows,
    };
  }

  private mapAuditRow(row: AuditLogRow) {
    return {
      id: row.id,
      userId: row.user_id,
      action: row.action,
      resource: row.entity_type,
      resourceId: row.entity_id,
      oldValues: row.old_values,
      newValues: row.new_values,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    };
  }
}
