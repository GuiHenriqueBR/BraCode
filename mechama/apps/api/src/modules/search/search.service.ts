import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchProfessionals(query: string, filters?: any) {
    // Implementar busca com Elasticsearch
    // Por enquanto, busca simples no PostgreSQL
    return this.prisma.professional.findMany({
      where: {
        user: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        },
        specialties: {
          hasSome: filters?.specialties || [],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        services: true,
      },
    });
  }

  async searchServices(query: string, filters?: any) {
    return this.prisma.service.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        categoryId: filters?.categoryId,
        isActive: true,
      },
      include: {
        professional: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        category: true,
      },
    });
  }
}