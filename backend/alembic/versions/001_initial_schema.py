"""Initial schema — users, api_keys, request_logs

Revision ID: 001
Revises:
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('company_name', sa.String(255)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('key_hash', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('key_prefix', sa.String(12), nullable=False),
        sa.Column('label', sa.String(100)),
        sa.Column('anthropic_key_encrypted', sa.String(500), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'request_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('api_key_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('api_keys.id'), nullable=False),
        sa.Column('model', sa.String(100), nullable=False),
        sa.Column('input_tokens', sa.Integer, nullable=False, server_default='0'),
        sa.Column('output_tokens', sa.Integer, nullable=False, server_default='0'),
        sa.Column('cost_usd', sa.Numeric(12, 6), nullable=False, server_default='0'),
        sa.Column('status_code', sa.Integer, nullable=False),
        sa.Column('latency_ms', sa.Integer, nullable=False),
        sa.Column('endpoint', sa.String(100), nullable=False, server_default='/v1/messages'),
        sa.Column('metadata', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_index('ix_request_logs_key_created', 'request_logs', ['api_key_id', 'created_at'])
    op.create_index('ix_request_logs_model_created', 'request_logs', ['model', 'created_at'])


def downgrade() -> None:
    op.drop_table('request_logs')
    op.drop_table('api_keys')
    op.drop_table('users')
