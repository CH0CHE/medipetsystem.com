import type { IFaqRepository } from "../domain/repositories";
import type { FaqItem } from "../domain/entities";
import type { CreateFaqInput } from "./dto/create-faq.schema";
import type { UpdateFaqInput } from "./dto/update-faq.schema";

export class FaqService {
  constructor(private readonly repository: IFaqRepository) {}

  async listFaqs(publishedOnly: boolean): Promise<FaqItem[]> {
    return this.repository.list(publishedOnly);
  }

  async createFaq(input: CreateFaqInput, actorUserId: string): Promise<string> {
    return this.repository.create({ ...input, actorUserId });
  }

  async updateFaq(id: string, input: UpdateFaqInput, actorUserId: string): Promise<void> {
    await this.repository.update({ id, ...input, actorUserId });
  }

  async deleteFaq(id: string, actorUserId: string): Promise<void> {
    await this.repository.delete(id, actorUserId);
  }
}
