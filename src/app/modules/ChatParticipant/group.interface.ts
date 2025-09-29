export interface IGroup extends Document {
  group_name: string;
  is_announcement_group: boolean;
  created_at: Date;
  updated_at: Date;
}
