# Re-export User from the original models.py file
from ..models import User, Base

__all__ = ['User', 'Base']
