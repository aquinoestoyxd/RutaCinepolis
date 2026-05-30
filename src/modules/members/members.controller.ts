import { Request, Response, NextFunction } from 'express';
import { membersService } from './members.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';
import type { RegisterMemberDto, UpdateMemberDto, MemberStatusDto, SearchMembersQuery } from './members.schema';

export class MembersController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as RegisterMemberDto;
      const member = await membersService.register(dto, req.user!.id, req.user!.email);
      ResponseHelper.created(res, member, 'Miembro registrado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as SearchMembersQuery;
      const { members, total, page, limit } = await membersService.findAll(query);
      ResponseHelper.paginated(res, members, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await membersService.findById(req.params.id);
      ResponseHelper.success(res, member);
    } catch (error) {
      next(error);
    }
  }

  async findByCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await membersService.findByCardNumber(req.params.cardNumber);
      ResponseHelper.success(res, member);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as UpdateMemberDto;
      const member = await membersService.update(req.params.id, dto, req.user!.id);
      ResponseHelper.success(res, member, 'Perfil actualizado');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as MemberStatusDto;
      await membersService.updateStatus(req.params.id, dto, req.user!.id);
      ResponseHelper.success(res, null, 'Estado actualizado');
    } catch (error) {
      next(error);
    }
  }
}

export const membersController = new MembersController();
