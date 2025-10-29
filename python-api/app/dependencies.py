from app.data.partido_data import PartidoDataAccess

def get_partido_data_access() -> PartidoDataAccess:
    """Dependency injection para PartidoDataAccess"""
    return PartidoDataAccess()
