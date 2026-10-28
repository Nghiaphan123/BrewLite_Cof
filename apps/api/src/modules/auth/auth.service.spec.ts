import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService account management', () => {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  const jwt = { signAsync: vi.fn() };
  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('creates a normalized account name and email with a hashed password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({
      id: 'user-1',
      name: data.name,
      email: data.email,
      loyaltyPoints: 0,
    }));

    await expect(
      service.register('  Brew Customer  ', 'BREW@EXAMPLE.COM', 'password123'),
    ).resolves.toEqual({
      id: 'user-1',
      name: 'Brew Customer',
      email: 'brew@example.com',
      loyaltyPoints: 0,
    });

    const createCall = prisma.user.create.mock.calls[0][0];
    expect(createCall.data.name).toBe('Brew Customer');
    expect(createCall.data.email).toBe('brew@example.com');
    expect(createCall.data.passwordHash).not.toBe('password123');
    await expect(
      bcrypt.compare('password123', createCall.data.passwordHash),
    ).resolves.toBe(true);
  });

  it('returns the authenticated account profile without its password hash', async () => {
    const createdAt = new Date('2026-01-15T00:00:00.000Z');
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Brew Customer',
      email: 'brew@example.com',
      loyaltyPoints: 12,
      createdAt,
    });

    await expect(service.getProfile('user-1')).resolves.toEqual({
      id: 'user-1',
      name: 'Brew Customer',
      email: 'brew@example.com',
      loyaltyPoints: 12,
      createdAt,
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        name: true,
        email: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });
  });

  it('changes the password only after verifying the current password', async () => {
    const passwordHash = await bcrypt.hash('oldPassword123', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash,
    });
    prisma.user.update.mockResolvedValue({});

    await expect(
      service.changePassword('user-1', 'oldPassword123', 'newPassword123'),
    ).resolves.toEqual({ message: 'Password changed successfully' });

    const updateCall = prisma.user.update.mock.calls[0][0];
    await expect(
      bcrypt.compare('newPassword123', updateCall.data.passwordHash),
    ).resolves.toBe(true);
    await expect(
      bcrypt.compare('oldPassword123', updateCall.data.passwordHash),
    ).resolves.toBe(false);
  });

  it('rejects a password change when the current password is incorrect', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: await bcrypt.hash('oldPassword123', 4),
    });

    await expect(
      service.changePassword('user-1', 'wrongPassword123', 'newPassword123'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'CURRENT_PASSWORD_INVALID' }),
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
