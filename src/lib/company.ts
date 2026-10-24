import { prisma } from "@/lib/prisma";

/**
 * Полное удаление компании со всеми данными.
 *
 * Канал трафика нельзя удалить, пока на него ссылаются прогнозы
 * (ForecastAllocation.adChannelId), а Postgres проверяет это ограничение
 * раньше, чем каскад дойдёт до прогнозов через кампании.
 * Поэтому сначала удаляем кампании (вместе с прогнозами), затем компанию.
 */
export async function deleteCompany(companyId: string) {
  await prisma.$transaction([
    prisma.campaign.deleteMany({ where: { companyId } }),
    prisma.company.delete({ where: { id: companyId } }),
  ]);
}
