import { describe, it, expect, vi } from "vitest";
import { FaqService } from "./faq.service";
import type { IFaqRepository } from "../domain/repositories";

function makeRepoMock(): IFaqRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue("faq-1"),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe("FaqService.listFaqs", () => {
  it("forwards the publishedOnly flag to the repository", async () => {
    const repo = makeRepoMock();
    const service = new FaqService(repo);

    await service.listFaqs(true);

    expect(repo.list).toHaveBeenCalledWith(true);
  });
});

describe("FaqService.createFaq", () => {
  it("forwards the input and actorUserId to the repository", async () => {
    const repo = makeRepoMock();
    const service = new FaqService(repo);

    const id = await service.createFaq(
      { question: "¿Qué es MediPet?", answer: "Una plataforma SaaS veterinaria.", displayOrder: 1, isPublished: true },
      "actor-1",
    );

    expect(id).toBe("faq-1");
    expect(repo.create).toHaveBeenCalledWith({
      question: "¿Qué es MediPet?",
      answer: "Una plataforma SaaS veterinaria.",
      displayOrder: 1,
      isPublished: true,
      actorUserId: "actor-1",
    });
  });
});

describe("FaqService.updateFaq", () => {
  it("forwards the id, input and actorUserId to the repository", async () => {
    const repo = makeRepoMock();
    const service = new FaqService(repo);

    await service.updateFaq(
      "faq-1",
      { question: "¿Qué es MediPet?", answer: "Respuesta actualizada.", displayOrder: 2, isPublished: false },
      "actor-1",
    );

    expect(repo.update).toHaveBeenCalledWith({
      id: "faq-1",
      question: "¿Qué es MediPet?",
      answer: "Respuesta actualizada.",
      displayOrder: 2,
      isPublished: false,
      actorUserId: "actor-1",
    });
  });
});

describe("FaqService.deleteFaq", () => {
  it("delegates to the repository", async () => {
    const repo = makeRepoMock();
    const service = new FaqService(repo);

    await service.deleteFaq("faq-1", "actor-1");

    expect(repo.delete).toHaveBeenCalledWith("faq-1", "actor-1");
  });
});
