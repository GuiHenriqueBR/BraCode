import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os pagamentos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagamentos retornada com sucesso',
  })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter pagamento por ID' })
  @ApiResponse({
    status: 200,
    description: 'Pagamento retornado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Pagamento não encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}