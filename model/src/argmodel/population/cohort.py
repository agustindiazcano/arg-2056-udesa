import numpy as np


def _validate_step_inputs(
    n_t: np.ndarray,
    survival: np.ndarray,
    fertility: np.ndarray,
    migration: np.ndarray,
) -> None:
    a_len = len(n_t)
    if a_len < 2:
        raise ValueError(f"step_population needs at least 2 age groups, got {a_len}")

    for name, arr in [
        ("survival", survival),
        ("fertility", fertility),
        ("migration", migration),
    ]:
        if len(arr) != a_len:
            raise ValueError(
                f"step_population: {name} has length {len(arr)}, expected {a_len}"
            )

    for name, arr in [
        ("n_t", n_t),
        ("survival", survival),
        ("fertility", fertility),
        ("migration", migration),
    ]:
        if not np.all(np.isfinite(arr)):
            raise ValueError(
                f"step_population: {name} contains a value that is not finite"
            )

    if np.any((survival < 0.0) | (survival > 1.0)):
        raise ValueError("step_population: survival must be between 0 and 1")

    if np.any(fertility < 0.0):
        raise ValueError("step_population: fertility must not be negative")

    if np.any(n_t < 0.0):
        raise ValueError("step_population: n_t must not be negative")


def _validate_matrix_shape(
    name: str,
    arr: np.ndarray,
    t_years: int,
    a_len: int,
) -> None:
    if arr.ndim != 2 or arr.shape != (t_years, a_len):
        if arr.ndim == 2:
            rows, cols = arr.shape
        elif arr.ndim == 1:
            rows, cols = arr.shape[0], 1
        elif arr.ndim == 0:
            rows, cols = 0, 0
        else:
            rows, cols = arr.shape[0], arr.shape[1]
        raise ValueError(
            f"project_population: {name} must have shape ({t_years}, {a_len}), got ({rows}, {cols})"
        )


def step_population(
    n_t: np.ndarray,
    survival: np.ndarray,
    fertility: np.ndarray,
    migration: np.ndarray,
) -> np.ndarray:
    """
    Steps the cohort population model forward by one year.

    Args:
        n_t: Population by age group at time t. Shape (A,).
        survival: Survival rate from age a to a+1. Shape (A,).
        fertility: Births per person of age a. Shape (A,).
        migration: Net migration (absolute numbers) added to age a. Shape (A,).

    Returns:
        n_next: Population by age group at time t+1. Shape (A,).
    """
    _validate_step_inputs(n_t, survival, fertility, migration)

    a_len = len(n_t)
    n_next = np.zeros(a_len, dtype=float)

    # Age 0: births from all ages
    n_next[0] = np.sum(n_t * fertility) + migration[0]

    # Age 1 to A-2: previous age survivors + migration
    n_next[1:a_len - 1] = n_t[0:a_len - 2] * survival[0:a_len - 2] + migration[1:a_len - 1]

    # Age A-1 (open interval): previous age survivors + own survivors + migration
    n_next[a_len - 1] = (
        n_t[a_len - 2] * survival[a_len - 2]
        + n_t[a_len - 1] * survival[a_len - 1]
        + migration[a_len - 1]
    )

    for i in range(a_len):
        val = n_next[i]
        if val < 0.0:
            val_str = str(int(val)) if float(val).is_integer() else str(val)
            raise ValueError(
                f"step_population: negative population in age group {i}: {val_str}"
            )

    return n_next


def project_population(
    n_t0: np.ndarray,
    survival: np.ndarray,
    fertility: np.ndarray,
    migration: np.ndarray,
) -> np.ndarray:
    """
    Projects the population forward for T years.

    Args:
        n_t0: Initial population. Shape (A,).
        survival: Survival rate. Shape (T, A).
        fertility: Fertility rate. Shape (T, A).
        migration: Net migration. Shape (T, A).

    Returns:
        n_all: Population trajectory. Shape (T+1, A).
    """
    a_len = len(n_t0)
    t_years = survival.shape[0] if survival.ndim >= 1 else 0

    _validate_matrix_shape("survival", survival, t_years, a_len)
    _validate_matrix_shape("fertility", fertility, t_years, a_len)
    _validate_matrix_shape("migration", migration, t_years, a_len)

    n_all = np.zeros((t_years + 1, a_len), dtype=float)
    n_all[0] = n_t0

    for t in range(t_years):
        try:
            n_all[t + 1] = step_population(
                n_all[t],
                survival[t],
                fertility[t],
                migration[t],
            )
        except ValueError as exc:
            raise ValueError(f"project_population: year {t}: {exc}") from None

    return n_all
