import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { PharEnumDatatype } from './datatypes.constants';

type EnumValueRow = QueryResultRow & {
  value: string;
};

@Injectable()
export class DatatypesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getEnumValues(requestedType: string, baseType: PharEnumDatatype) {
    const result = await this.databaseService.query<EnumValueRow>(
      `
      SELECT e.enumlabel AS value
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE n.nspname = 'public'
        AND t.typname = $1
      ORDER BY e.enumsortorder ASC
      `,
      [baseType],
    );

    if (!result.rows.length) {
      throw new NotFoundException(`Datatype "${baseType}" was not found`);
    }

    return {
      type: requestedType,
      values: result.rows.map((row) => row.value),
    };
  }
}
