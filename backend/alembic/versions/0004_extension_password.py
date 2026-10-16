"""extension password

Revision ID: 0004
Revises: 0003
"""
from alembic import op
import sqlalchemy as sa


revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('extensions', sa.Column('password', sa.String(length=64), nullable=False, server_default=''))
    op.alter_column('extensions', 'password', server_default=None)
    # Avval pjsip.conf da qo'lda yozilgan raqamlar parollari saqlanib qoladi
    op.execute("UPDATE extensions SET password = 'pass' || number WHERE number IN ('1001', '1002')")


def downgrade() -> None:
    op.drop_column('extensions', 'password')
