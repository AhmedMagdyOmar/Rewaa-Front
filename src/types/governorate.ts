export type CountryCode =
  | "egypt"
  | "saudiArabia"
  | "uae"
  | "kuwait"
  | "qatar"
  | "jordan"
  | "oman"
  | "other";

export interface GovernorateItem {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  countryCode: CountryCode;
  countryNameAr: string;
  countryNameEn: string;
  flagEmoji: string;
  studentsCount: number;
  activeStudentsCount: number;
  percentage: number;
  centerStudents: number;
  onlineStudents: number;
  topGradeKey: string;
}
