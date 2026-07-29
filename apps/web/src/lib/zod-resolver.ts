import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
import { appendErrors, FieldError, FieldValues, Resolver } from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * A zod v4 compatible resolver for react-hook-form.
 *
 * `@hookform/resolvers@3.x` ships a zod v3 era `zodResolver`: it catches whatever
 * `parseAsync` throws and decides "is this a validation error?" with `err.errors != null`.
 * Zod v4 renamed that property - a `ZodError` now only carries `.issues` - so the check
 * fails and the resolver rethrows. The result is an unhandled `ZodError` in the console
 * and a form that silently refuses to submit while showing no field messages.
 *
 * This uses `safeParseAsync`, so there is no throwing and no error-shape sniffing at all,
 * and reads `.issues`, which exists in both zod v3 and v4.
 *
 * Drop-in replacement for `zodResolver`. Prefer upgrading `@hookform/resolvers` to v5
 * (which supports zod v4 natively) once the 23 `yupResolver` call sites in this app can
 * be regression-tested against it.
 */
export function zodResolver<TFieldValues extends FieldValues = FieldValues>(
  schema: ZodType<any, any, any>,
  resolverOptions: { raw?: boolean } = {}
): Resolver<TFieldValues> {
  return async (values, _context, options) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      if (options.shouldUseNativeValidation) validateFieldsNatively({}, options);
      return { errors: {}, values: resolverOptions.raw ? values : (result.data as TFieldValues) };
    }

    const collectAll = !options.shouldUseNativeValidation && options.criteriaMode === 'all';
    const errors: Record<string, FieldError> = {};

    for (const issue of result.error.issues) {
      // A top-level refinement has an empty path; RHF needs some key to hang it on.
      const path = issue.path.map((segment) => String(segment)).join('.') || 'root';

      if (!errors[path]) {
        errors[path] = { message: issue.message, type: issue.code };
      }

      if (collectAll) {
        const existingTypes = errors[path].types;
        const sameCode = existingTypes && existingTypes[issue.code];
        errors[path] = appendErrors(
          path,
          true,
          errors,
          issue.code,
          sameCode ? ([] as string[]).concat(sameCode as string[], issue.message) : issue.message
        ) as FieldError;
      }
    }

    return { values: {}, errors: toNestErrors(errors, options) };
  };
}
