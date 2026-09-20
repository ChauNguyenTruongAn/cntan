type CreateSubsidiaryInput = {
  name: string;
  code: string;
  country: string;
  organizationId: number;
};

type UpdateSubsidiaryInput = {
  subsidiaryId: number;
  name: string | null;
  code: string | null;
  country: string | null;
};

export {CreateSubsidiaryInput, UpdateSubsidiaryInput}