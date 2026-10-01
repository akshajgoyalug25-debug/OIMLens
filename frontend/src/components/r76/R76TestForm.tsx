import { useMemo, useState } from 'react'
import type {
  R76Instrument,
  R76TestDefinition,
  R76TestResult,
} from '../../services/r76Api'
import { R76_TEST_WORKFLOW } from '../../data/r76TestWorkflowMap'

type Props = {
  definition: R76TestDefinition & {
    no_manual_observation_required?: boolean
    no_manual_reason?: string
    input_fields?: any[]
    purpose?: string
  }
  instrument?: R76Instrument
  result?: R76TestResult | null
  disabled?: boolean
  error?: string | null
  onExecute: (inputs: Record<string, unknown>) => void
  onPreviousTest?: () => void
  onNextTest?: () => void
  onBackToProcedures?: () => void
}

type RepeatRow = {
  load: string
  indication: string
  additional_load: string
}

function numberOrZero(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function calculateMPE(
  accuracyClass?: string,
  load?: number,
  e?: number,
): number | undefined {
  if (
    !accuracyClass ||
    load === undefined ||
    e === undefined ||
    e <= 0 ||
    load < 0
  ) {
    return undefined
  }

  const intervals = load / e

  const limits: Record<string, [number, number]> = {
    I: [50000, 200000],
    II: [5000, 20000],
    III: [500, 2000],
    IIII: [50, 200],
  }

  const limit = limits[accuracyClass]

  if (!limit) return undefined

  if (intervals <= limit[0]) {
    return 0.5 * e
  }

  if (intervals <= limit[1]) {
    return 1.0 * e
  }

  return 1.5 * e
}

function Field({
  label,
  value,
  onChange,
  type = 'number',
  step = 'any',
  unit,
  helpText,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  step?: string
  unit?: string
  helpText?: string
  options?: { label: string; value: string }[]
}) {
  return (
    <label className="sih-field-label">
      <span>{label}</span>
      {type === 'select' && options ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="sih-input-field"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="sih-input-wrap">
          <input
            type={type}
            step={step}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="sih-input-field"
          />
          {unit && <span className="sih-unit-tag">{unit}</span>}
        </div>
      )}
      {helpText && <small className="sih-field-help">{helpText}</small>}
    </label>
  )
}

export function R76TestForm({
  definition,
  instrument,
  result,
  disabled,
  error,
  onExecute,
  onPreviousTest,
  onNextTest,
  onBackToProcedures,
}: Props) {
  const e = instrument?.e
  const d = instrument?.d
  const accuracyClass = instrument?.accuracy_class
  const workflow = R76_TEST_WORKFLOW[definition.test_code] ?? 'metrological'

  const [values, setValues] = useState<Record<string, string>>({
    load: '10',
    indication: '10.01',
    additional_load: '0',
    zero_error: '0',

    initial_indication: '10',
    final_indication: '10.01',

    permanent_displacement_mm: '1',

    initial_error: '0',
    error_at_15_min: '0',
    error_at_30_min: '0',
    temperature_change: '0',
    duration_minutes: '30',

    initial_indication_zero: '0',
    initial_additional_load: '0',

    zero_positive_range: '1',
    zero_negative_range: '0',
    zero_overall_range: '1',

    zero_accuracy_load: '0',
    zero_accuracy_indication: '0',
    zero_accuracy_additional_load: '0',

    tilt_reference_zero: '0',
    tilt_reference_low_indication: '5',
    tilt_low_load: '5',
    tilt_reference_max_indication: '30',

    tilt_longitudinal_forward_zero: '0',
    tilt_longitudinal_forward_low: '5',
    tilt_longitudinal_forward_max: '30',

    tilt_longitudinal_backward_zero: '0',
    tilt_longitudinal_backward_low: '5',
    tilt_longitudinal_backward_max: '30',

    tilt_transverse_left_zero: '0',
    tilt_transverse_left_low: '5',
    tilt_transverse_left_max: '30',

    tilt_transverse_right_zero: '0',
    tilt_transverse_right_low: '5',
    tilt_transverse_right_max: '30',

    warmup_disconnected_hours: '8',
    warmup_result_available: 'false',

    warmup_zero_0: '0',
    warmup_load_0: '30',
    warmup_indication_0: '30',
    warmup_additional_0: '0',

    warmup_zero_5: '0',
    warmup_load_5: '30',
    warmup_indication_5: '30',
    warmup_additional_5: '0',

    warmup_zero_15: '0',
    warmup_load_15: '30',
    warmup_indication_15: '30',
    warmup_additional_15: '0',

    warmup_zero_30: '0',
    warmup_load_30: '30',
    warmup_indication_30: '30',
    warmup_additional_30: '0',
    indication_30_min: '0',
    additional_load_30_min: '0',
    indication_35_min: '',
    additional_load_35_min: '',
    e1: '',

    indication_1: '0',
    additional_load_1: '0',
    voltage_nominal: '230',
    voltage_lower: '195.5',
    voltage_upper: '253',

    voltage_reference_10e_load: '0.1',
    voltage_reference_10e_indication: '0.1',
    voltage_reference_10e_additional: '0',
    voltage_reference_10e_zero: '0',
    voltage_reference_high_load: '20',
    voltage_reference_high_indication: '20',
    voltage_reference_high_additional: '0',
    voltage_reference_high_zero: '0',

    voltage_lower_10e_load: '0.1',
    voltage_lower_10e_indication: '0.1',
    voltage_lower_10e_additional: '0',
    voltage_lower_10e_zero: '0',
    voltage_lower_high_load: '20',
    voltage_lower_high_indication: '20',
    voltage_lower_high_additional: '0',
    voltage_lower_high_zero: '0',

    voltage_upper_10e_load: '0.1',
    voltage_upper_10e_indication: '0.1',
    voltage_upper_10e_additional: '0',
    voltage_upper_10e_zero: '0',
    voltage_upper_high_load: '20',
    voltage_upper_high_indication: '20',
    voltage_upper_high_additional: '0',
    voltage_upper_high_zero: '0',

    endurance_cycles: '100000',
    endurance_before_load: '15',
    endurance_before_indication: '15.005',
    endurance_before_additional: '0',
    endurance_before_zero: '0',
    endurance_after_load: '15',
    endurance_after_indication: '15.005',
    endurance_after_additional: '0',
    endurance_after_zero: '0',

    temperature_static_reference_1: '20',
    temperature_static_load_1: '10',
    temperature_static_indication_1: '10.005',
    temperature_static_additional_1: '0',
    temperature_static_zero_1: '0',

    temperature_static_reference_2: '40',
    temperature_static_load_2: '10',
    temperature_static_indication_2: '10.005',
    temperature_static_additional_2: '0',
    temperature_static_zero_2: '0',

    temperature_static_reference_3: '-10',
    temperature_static_load_3: '10',
    temperature_static_indication_3: '10.005',
    temperature_static_additional_3: '0',
    temperature_static_zero_3: '0',

    temperature_static_reference_4: '5',
    temperature_static_load_4: '10',
    temperature_static_indication_4: '10.005',
    temperature_static_additional_4: '0',
    temperature_static_zero_4: '0',
    temperature_static_include_4: 'false',

    temperature_static_reference_5: '20',
    temperature_static_load_5: '10',
    temperature_static_indication_5: '10.005',
    temperature_static_additional_5: '0',
    temperature_static_zero_5: '0',

    temperature_1: '20',
    indication_2: '0',
    additional_load_2: '0',
    temperature_2: '25',

    indication_3: '0',
    additional_load_3: '0',
    temperature_3: '40',

    indication_4: '0',
    additional_load_4: '0',
    temperature_4: '-10',

    discrimination_type: 'digital',
    visible_displacement: 'true',
    mpe_override: '',

    eccentric_location_1: 'Center',
    eccentric_load_1: '10',
    eccentric_indication_1: '10',
    eccentric_additional_1: '0',
    eccentric_zero_1: '0',

    eccentric_location_2: 'Front',
    eccentric_load_2: '10',
    eccentric_indication_2: '10',
    eccentric_additional_2: '0',
    eccentric_zero_2: '0',

    eccentric_location_3: 'Rear',
    eccentric_load_3: '10',
    eccentric_indication_3: '10',
    eccentric_additional_3: '0',
    eccentric_zero_3: '0',
  })

  const [discriminationRows, setDiscriminationRows] = useState([
    {
      load: String(instrument?.min_capacity ?? ''),
      initial_indication: String(instrument?.min_capacity ?? ''),
      final_indication: String(instrument?.min_capacity ?? ''),
      visible_displacement: 'true',
    },
    {
      load: String(
        instrument?.max_capacity !== undefined
          ? instrument.max_capacity / 2
          : '',
      ),
      initial_indication: String(
        instrument?.max_capacity !== undefined
          ? instrument.max_capacity / 2
          : '',
      ),
      final_indication: String(
        instrument?.max_capacity !== undefined
          ? instrument.max_capacity / 2
          : '',
      ),
      visible_displacement: 'true',
    },
    {
      load: String(instrument?.max_capacity ?? ''),
      initial_indication: String(instrument?.max_capacity ?? ''),
      final_indication: String(instrument?.max_capacity ?? ''),
      visible_displacement: 'true',
    },
  ])

  const [weighingRows, setWeighingRows] = useState<RepeatRow[]>(
    Array.from({ length: 10 }, (_, index) => ({
      load: index === 0 ? '0' : index === 9 ? '30' : String(index * 30 / 9),
      indication: index === 0 ? '0' : index === 9 ? '30' : String(index * 30 / 9),
      additional_load: '0',
    })),
  )

  const [enduranceBeforeRows, setEnduranceBeforeRows] =
    useState<RepeatRow[]>(
      Array.from({ length: 7 }, (_, index) => ({
        load: index === 6 ? '30' : String(index * 5),
        indication: index === 6 ? '30' : String(index * 5),
        additional_load: '0',
      })),
    )

  const [enduranceAfterRows, setEnduranceAfterRows] =
    useState<RepeatRow[]>(
      Array.from({ length: 7 }, (_, index) => ({
        load: index === 6 ? '30' : String(index * 5),
        indication: index === 6 ? '30' : String(index * 5),
        additional_load: '0',
      })),
    )

  const [enduranceBeforeZero, setEnduranceBeforeZero] =
    useState<string[]>(Array(10).fill('0'))

  const [enduranceAfterZero, setEnduranceAfterZero] =
    useState<string[]>(Array(10).fill('0'))

  const [repeatRows, setRepeatRows] = useState<RepeatRow[]>(
    Array.from({ length: 20 }, (_, index) => ({
      load: index < 10 ? '15' : '30',
      indication: index < 10 ? '15' : '30',
      additional_load: '0',
    })),
  )

  const setValue = (key: string, value: string) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const weighingMPE = useMemo(
    () =>
      calculateMPE(
        accuracyClass,
        numberOrZero(values.load),
        e,
      ),
    [accuracyClass, values.load, e],
  )

  const eccentricLoad = numberOrZero(values.eccentric_load_1)

  const eccentricMPE = useMemo(
    () =>
      calculateMPE(
        accuracyClass,
        eccentricLoad,
        e,
      ),
    [accuracyClass, eccentricLoad, e],
  )

  const maxMPE = useMemo(
    () =>
      calculateMPE(
        accuracyClass,
        instrument?.max_capacity,
        e,
      ),
    [accuracyClass, instrument?.max_capacity, e],
  )

  function execute() {
    const code = definition.test_code

    if (code === 'WEIGHING_PERFORMANCE') {
      const observations = weighingRows.map((row) => ({
        load: numberOrZero(row.load),
        indication: numberOrZero(row.indication),
        additional_load: numberOrZero(row.additional_load),
        zero_error: numberOrZero(values.zero_error),
      }))

      onExecute({
        accuracy_class: accuracyClass,
        max_capacity: instrument?.max_capacity,
        e,
        observations,
      })
      return
    }

    if (code === 'ECCENTRIC_LOADING') {
      const observations = [1, 2, 3].map((index) => ({
        location: values[`eccentric_location_${index}`],
        load: numberOrZero(values[`eccentric_load_${index}`]),
        indication: numberOrZero(
          values[`eccentric_indication_${index}`],
        ),
        additional_load: numberOrZero(
          values[`eccentric_additional_${index}`],
        ),
        zero_error: numberOrZero(
          values[`eccentric_zero_${index}`],
        ),
      }))

      onExecute({
        observations,
        e,
        mpe: eccentricMPE,
      })
      return
    }

    if (code === 'DISCRIMINATION') {
      const type = values.discrimination_type

      const observations = discriminationRows.map((row) => {
        const observation: Record<string, unknown> = {
          load: numberOrZero(row.load),
        }

        if (type === 'non_self_indicating') {
          observation.visible_displacement =
            row.visible_displacement === 'true'
        } else {
          observation.initial_indication =
            numberOrZero(row.initial_indication)
          observation.final_indication =
            numberOrZero(row.final_indication)

          if (type === 'analog') {
            const load = numberOrZero(row.load)
            observation.mpe =
              values.mpe_override !== ''
                ? numberOrZero(values.mpe_override)
                : calculateMPE(accuracyClass, load, e)
          }
        }

        return observation
      })

      onExecute({
        test_type: type,
        observations,
        d,
        mpe:
          type !== 'digital' && values.mpe_override !== ''
            ? numberOrZero(values.mpe_override)
            : undefined,
      })

      return
    }

    if (code === 'SENSITIVITY') {
      onExecute({
        accuracy_class: accuracyClass,
        max_capacity: instrument?.max_capacity,
        mpe: maxMPE,
        permanent_displacement_mm: numberOrZero(
          values.permanent_displacement_mm,
        ),
      })
      return
    }

    if (code === 'REPEATABILITY') {
      const toSeries = (rows: RepeatRow[]) =>
        rows.map((row) => ({
          load: numberOrZero(row.load),
          indication: numberOrZero(row.indication),
          additional_load: numberOrZero(row.additional_load),
          zero_error: 0,
        }))

      onExecute({
        accuracy_class: accuracyClass,
        max_capacity: instrument?.max_capacity,
        e,
        mode: 'type_approval',
        series: [
          toSeries(repeatRows.slice(0, 10)),
          toSeries(repeatRows.slice(10, 20)),
        ],
      })
      return
    }

    if (code === 'CREEP') {
      onExecute({
        e,
        initial_error: numberOrZero(values.initial_error),
        error_at_15_min: numberOrZero(
          values.error_at_15_min,
        ),
        error_at_30_min: numberOrZero(
          values.error_at_30_min,
        ),
        temperature_change: numberOrZero(
          values.temperature_change,
        ),
        duration_minutes: numberOrZero(
          values.duration_minutes,
        ),
      })
      return
    }

    if (code === 'TILT') {
      onExecute({
        accuracy_class: instrument?.accuracy_class,
        e,
        max_capacity: instrument?.max_capacity,
        reference_zero: numberOrZero(
          values.tilt_reference_zero,
        ),
        reference_low_indication: numberOrZero(
          values.tilt_reference_low_indication,
        ),
        low_load: numberOrZero(
          values.tilt_low_load,
        ),
        reference_max_indication: numberOrZero(
          values.tilt_reference_max_indication,
        ),
        directions: [
          {
            direction: 'Longitudinal forward',
            tilted_zero: numberOrZero(
              values.tilt_longitudinal_forward_zero,
            ),
            tilted_low: numberOrZero(
              values.tilt_longitudinal_forward_low,
            ),
            tilted_max: numberOrZero(
              values.tilt_longitudinal_forward_max,
            ),
          },
          {
            direction: 'Longitudinal backward',
            tilted_zero: numberOrZero(
              values.tilt_longitudinal_backward_zero,
            ),
            tilted_low: numberOrZero(
              values.tilt_longitudinal_backward_low,
            ),
            tilted_max: numberOrZero(
              values.tilt_longitudinal_backward_max,
            ),
          },
          {
            direction: 'Transverse left',
            tilted_zero: numberOrZero(
              values.tilt_transverse_left_zero,
            ),
            tilted_low: numberOrZero(
              values.tilt_transverse_left_low,
            ),
            tilted_max: numberOrZero(
              values.tilt_transverse_left_max,
            ),
          },
          {
            direction: 'Transverse right',
            tilted_zero: numberOrZero(
              values.tilt_transverse_right_zero,
            ),
            tilted_low: numberOrZero(
              values.tilt_transverse_right_low,
            ),
            tilted_max: numberOrZero(
              values.tilt_transverse_right_max,
            ),
          },
        ],
      })
      return
    }

    if (code === 'WARM_UP') {
      onExecute({
        accuracy_class: instrument?.accuracy_class,
        e,
        max_capacity: instrument?.max_capacity,
        disconnected_hours: numberOrZero(
          values.warmup_disconnected_hours,
        ),
        weighing_result_available_during_warmup:
          values.warmup_result_available === 'true',
        observations: [
          {
            minutes: 0,
            zero_error: numberOrZero(values.warmup_zero_0),
            load: numberOrZero(values.warmup_load_0),
            indication: numberOrZero(
              values.warmup_indication_0,
            ),
            additional_load: numberOrZero(
              values.warmup_additional_0,
            ),
          },
          {
            minutes: 5,
            zero_error: numberOrZero(values.warmup_zero_5),
            load: numberOrZero(values.warmup_load_5),
            indication: numberOrZero(
              values.warmup_indication_5,
            ),
            additional_load: numberOrZero(
              values.warmup_additional_5,
            ),
          },
          {
            minutes: 15,
            zero_error: numberOrZero(
              values.warmup_zero_15,
            ),
            load: numberOrZero(values.warmup_load_15),
            indication: numberOrZero(
              values.warmup_indication_15,
            ),
            additional_load: numberOrZero(
              values.warmup_additional_15,
            ),
          },
          {
            minutes: 30,
            zero_error: numberOrZero(
              values.warmup_zero_30,
            ),
            load: numberOrZero(values.warmup_load_30),
            indication: numberOrZero(
              values.warmup_indication_30,
            ),
            additional_load: numberOrZero(
              values.warmup_additional_30,
            ),
          },
        ],
      })
      return
    }

    if (code === 'ZERO_RANGE') {
      onExecute({
        positive_range: numberOrZero(
          values.zero_positive_range,
        ),
        negative_range: numberOrZero(
          values.zero_negative_range,
        ),
        overall_range: numberOrZero(
          values.zero_overall_range,
        ),
        max_capacity: instrument?.max_capacity,
      })
      return
    }

    if (code === 'ZERO_ACCURACY') {
      onExecute({
        load: numberOrZero(
          values.zero_accuracy_load,
        ),
        indication: numberOrZero(
          values.zero_accuracy_indication,
        ),
        additional_load: numberOrZero(
          values.zero_accuracy_additional_load,
        ),
        e,
      })
      return
    }

    if (code === 'ZERO_RETURN') {
      onExecute({
        initial_indication: numberOrZero(
          values.initial_indication_zero,
        ),
        initial_additional_load: numberOrZero(
          values.initial_additional_load,
        ),
        indication_30_min: numberOrZero(
          values.indication_30_min,
        ),
        additional_load_30_min: numberOrZero(
          values.additional_load_30_min,
        ),
        e,
        indication_35_min:
          values.indication_35_min === ''
            ? undefined
            : numberOrZero(values.indication_35_min),
        additional_load_35_min:
          values.additional_load_35_min === ''
            ? undefined
            : numberOrZero(
                values.additional_load_35_min,
              ),
        e1:
          values.e1 === ''
            ? undefined
            : numberOrZero(values.e1),
      })
      return
    }

    if (
      code === 'VOLTAGE_AC' ||
      code === 'VOLTAGE_EXTERNAL' ||
      code === 'VOLTAGE_BATTERY' ||
      code === 'VOLTAGE_VEHICLE'
    ) {
      const voltageObservations = [
        {
          voltage: numberOrZero(values.voltage_nominal),
          load: numberOrZero(values.voltage_reference_10e_load),
          indication: numberOrZero(values.voltage_reference_10e_indication),
          additional_load: numberOrZero(
            values.voltage_reference_10e_additional,
          ),
          zero_error: numberOrZero(values.voltage_reference_10e_zero),
        },
        {
          voltage: numberOrZero(values.voltage_nominal),
          load: numberOrZero(values.voltage_reference_high_load),
          indication: numberOrZero(values.voltage_reference_high_indication),
          additional_load: numberOrZero(
            values.voltage_reference_high_additional,
          ),
          zero_error: numberOrZero(values.voltage_reference_high_zero),
        },
        {
          voltage: numberOrZero(values.voltage_lower),
          load: numberOrZero(values.voltage_lower_10e_load),
          indication: numberOrZero(values.voltage_lower_10e_indication),
          additional_load: numberOrZero(
            values.voltage_lower_10e_additional,
          ),
          zero_error: numberOrZero(values.voltage_lower_10e_zero),
        },
        {
          voltage: numberOrZero(values.voltage_lower),
          load: numberOrZero(values.voltage_lower_high_load),
          indication: numberOrZero(values.voltage_lower_high_indication),
          additional_load: numberOrZero(
            values.voltage_lower_high_additional,
          ),
          zero_error: numberOrZero(values.voltage_lower_high_zero),
        },
        {
          voltage: numberOrZero(values.voltage_upper),
          load: numberOrZero(values.voltage_upper_10e_load),
          indication: numberOrZero(values.voltage_upper_10e_indication),
          additional_load: numberOrZero(
            values.voltage_upper_10e_additional,
          ),
          zero_error: numberOrZero(values.voltage_upper_10e_zero),
        },
        {
          voltage: numberOrZero(values.voltage_upper),
          load: numberOrZero(values.voltage_upper_high_load),
          indication: numberOrZero(values.voltage_upper_high_indication),
          additional_load: numberOrZero(
            values.voltage_upper_high_additional,
          ),
          zero_error: numberOrZero(values.voltage_upper_high_zero),
        },
      ]

      const payload: Record<string, unknown> = {
        accuracy_class: accuracyClass,
        e,
        max_capacity: instrument?.max_capacity,
        nominal_voltage: numberOrZero(values.voltage_nominal),
        observations: voltageObservations,
      }

      if (code === 'VOLTAGE_AC') {
        payload.minimum_voltage = numberOrZero(values.voltage_lower)
        payload.maximum_voltage = numberOrZero(values.voltage_upper)
      }

      if (
        code === 'VOLTAGE_EXTERNAL' ||
        code === 'VOLTAGE_BATTERY'
      ) {
        payload.min_operating_voltage = numberOrZero(
          values.voltage_lower,
        )
        payload.maximum_voltage = numberOrZero(values.voltage_upper)
      }

      if (code === 'VOLTAGE_VEHICLE') {
        payload.min_operating_voltage = numberOrZero(
          values.voltage_lower,
        )
      }

      onExecute(payload)
      return
    }

    if (code === 'ENDURANCE') {
      onExecute({
        accuracy_class: accuracyClass,
        max_capacity: instrument?.max_capacity,
        e,
        cycles: numberOrZero(values.endurance_cycles),
        before: enduranceBeforeRows.map((row, index) => ({
          load: numberOrZero(row.load),
          indication: numberOrZero(row.indication),
          additional_load: numberOrZero(row.additional_load),
          zero_error: numberOrZero(enduranceBeforeZero[index]),
        })),
        after: enduranceAfterRows.map((row, index) => ({
          load: numberOrZero(row.load),
          indication: numberOrZero(row.indication),
          additional_load: numberOrZero(row.additional_load),
          zero_error: numberOrZero(enduranceAfterZero[index]),
        })),
      })
      return
    }
    if (code === 'TEMPERATURE_STATIC') {
      const observations = [1, 2, 3, 4, 5]
        .filter(
          (index) =>
            index !== 4 ||
            values.temperature_static_include_4 === 'true',
        )
        .map((index) => ({
          temperature: numberOrZero(
            values[`temperature_static_reference_${index}`],
          ),
          load: numberOrZero(
            values[`temperature_static_load_${index}`],
          ),
          indication: numberOrZero(
            values[`temperature_static_indication_${index}`],
          ),
          additional_load: numberOrZero(
            values[`temperature_static_additional_${index}`],
          ),
          zero_error: numberOrZero(
            values[`temperature_static_zero_${index}`],
          ),
        }))

      onExecute({
        accuracy_class: accuracyClass,
        max_capacity: instrument?.max_capacity,
        e,
        observations,
      })
      return
    }

    if (code === 'TEMPERATURE_ZERO') {
      const observations = [1, 2, 3, 4].map((index) => ({
        temperature: numberOrZero(
          values[`temperature_${index}`],
        ),
        indication: numberOrZero(
          values[`indication_${index}`],
        ),
        additional_load: numberOrZero(
          values[`additional_load_${index}`],
        ),
      }))

      onExecute({
        accuracy_class: accuracyClass,
        observations,
        e,
      })
      return
    }

    if (code === 'ZERO_TRACKING') {
      onExecute({
        accuracy_class: accuracyClass,
        max_capacity: instrument?.max_capacity,
        e,
        load: numberOrZero(values.zero_tracking_load),
        indication: numberOrZero(values.zero_tracking_indication),
        additional_load: numberOrZero(
          values.zero_tracking_additional_load,
        ),
        correction_rate: numberOrZero(values.zero_tracking_rate),
        equilibrium_stable:
          values.zero_tracking_equilibrium === 'true'
            ? true
            : values.zero_tracking_equilibrium === 'false'
              ? false
              : undefined,
        notes: values.notes || undefined,
      })
      return
    }

    // Generic payload construction for the non-specialized workflows.
    const payload: Record<string, unknown> = {
      ...values,
      accuracy_class: accuracyClass,
      max_capacity: instrument?.max_capacity,
      e,
      measured_error:
        values.measured_error !== undefined && values.measured_error !== ''
          ? numberOrZero(values.measured_error)
          : undefined,
      inspection_passed:
        workflow === 'inspection'
          ? values.inspection_passed === 'true'
            ? true
            : values.inspection_passed === 'false'
              ? false
              : undefined
          : undefined,
      significant_fault:
        workflow === 'disturbance'
          ? values.significant_fault === 'true'
            ? true
            : values.significant_fault === 'false'
              ? false
              : undefined
          : undefined,
      notes: values.notes || undefined,
    }

    onExecute(payload)
  }

  if (!instrument) {
    return (
      <div className="r76-not-implemented">
        Select an instrument before entering test data.
      </div>
    )
  }

  const code = definition.test_code

  return (
    <div className="sih-test-runner-container">
      {/* Compact Read-only Instrument Parameters Bar */}
      <div className="sih-instrument-params-bar">
        <div className="sih-param-item">
          <span className="sih-param-label">ACCURACY CLASS</span>
          <strong className="sih-param-val">Class {instrument?.accuracy_class || 'III'}</strong>
        </div>
        <div className="sih-param-item">
          <span className="sih-param-label">MAX CAPACITY</span>
          <strong className="sih-param-val">{instrument?.max_capacity ?? '—'} {instrument?.unit || 'kg'}</strong>
        </div>
        <div className="sih-param-item">
          <span className="sih-param-label">e</span>
          <strong className="sih-param-val">{instrument?.e ?? '—'} {instrument?.unit || 'kg'}</strong>
        </div>
        <div className="sih-param-item">
          <span className="sih-param-label">d</span>
          <strong className="sih-param-val">{instrument?.d ?? '—'} {instrument?.unit || 'kg'}</strong>
        </div>
        <div className="sih-param-item">
          <span className="sih-param-label">MAX n</span>
          <strong className="sih-param-val">
            {instrument?.n ?? (instrument?.e && instrument?.max_capacity ? Math.round(instrument.max_capacity / instrument.e) : '—')}
          </strong>
        </div>
      </div>

      {/* Prominent Compact Evaluation Result Card if recorded */}
      {result && (
        <div className={`sih-result-card ${result.pass_fail ? 'pass' : 'fail'}`}>
          <div className="sih-result-card-header">
            <div className="sih-result-status-group">
              <span className={`sih-result-badge ${result.pass_fail ? 'pass' : 'fail'}`}>
                {result.pass_fail ? 'PASS ✓' : 'FAIL ✕'}
              </span>
              <div className="sih-result-meta-text">
                <strong>Compliance Evaluation Completed</strong>
                <span>
                  {result.source_document || 'OIML R 76-1:2006'} · Clause {result.source_clause || definition.source_clause || '—'}
                </span>
              </div>
            </div>
            {onNextTest && (
              <button
                type="button"
                className="sih-next-test-btn"
                onClick={onNextTest}
              >
                NEXT TEST →
              </button>
            )}
          </div>

          {code === 'REPEATABILITY' ? (
            (() => {
              const repeatability = (result.calculated_values || {}) as {
                series?: Array<{
                  target_load?: number
                  observations?: number[]
                  indications?: number[]
                  errors?: number[]
                  max_error?: number
                  min_error?: number
                  error_range?: number
                  mpe?: number
                  passed?: boolean
                }>
              }

              const series = Array.isArray(repeatability.series)
                ? repeatability.series
                : []

              const unit = instrument?.unit || 'kg'

              return (
                <div className="sih-repeatability-result">
                  <div className="sih-result-details-row">
                    <div className="sih-result-metric">
                      <span>WORST INDIVIDUAL ERROR</span>
                      <strong>
                        {result.measured_error !== undefined && result.measured_error !== null
                          ? `${Number(result.measured_error) >= 0 ? '+' : ''}${Number(result.measured_error).toFixed(4)} ${unit}`
                          : '—'}
                      </strong>
                    </div>

                    <div className="sih-result-metric">
                      <span>APPLICABLE MPE</span>
                      <strong>
                        {result.mpe_value !== undefined && result.mpe_value !== null
                          ? `±${Number(result.mpe_value).toFixed(4)} ${unit}`
                          : '—'}
                      </strong>
                    </div>

                    <div className="sih-result-metric evaluation">
                      <span>EVALUATION</span>
                      <strong className="sih-result-reason">
                        {result.failure_reason ||
                          (result.pass_fail
                            ? 'All repeatability series comply with the applicable limits.'
                            : 'One or more individual errors or repeatability ranges exceed the applicable limits.')}
                      </strong>
                    </div>
                  </div>

                  {series.map((item, seriesIndex) => {
                    const observations = Array.isArray(item.observations)
                      ? item.observations
                      : []

                    const errors = Array.isArray(item.errors)
                      ? item.errors
                      : []

                    return (
                      <div className="sih-repeatability-series" key={seriesIndex}>
                        <div className="sih-repeatability-series-header">
                          <div>
                            <span className="sih-repeatability-series-label">
                              SERIES {seriesIndex + 1}
                            </span>
                            <strong>
                              Target Load: {item.target_load !== undefined
                                ? `${Number(item.target_load).toFixed(3)} ${unit}`
                                : '—'}
                            </strong>
                          </div>

                          <span
                            className={`sih-repeatability-series-status ${
                              item.passed ? 'pass' : 'fail'
                            }`}
                          >
                            {item.passed ? 'PASS ✓' : 'FAIL ✕'}
                          </span>
                        </div>

                        <div className="sih-repeatability-summary">
                          <div>
                            <span>MAX ERROR</span>
                            <strong>
                              {item.max_error !== undefined
                                ? `${Number(item.max_error) >= 0 ? '+' : ''}${Number(item.max_error).toFixed(4)} ${unit}`
                                : '—'}
                            </strong>
                          </div>

                          <div>
                            <span>MIN ERROR</span>
                            <strong>
                              {item.min_error !== undefined
                                ? `${Number(item.min_error) >= 0 ? '+' : ''}${Number(item.min_error).toFixed(4)} ${unit}`
                                : '—'}
                            </strong>
                          </div>

                          <div>
                            <span>ERROR RANGE</span>
                            <strong>
                              {item.error_range !== undefined
                                ? `${Number(item.error_range).toFixed(4)} ${unit}`
                                : '—'}
                            </strong>
                          </div>

                          <div>
                            <span>MPE</span>
                            <strong>
                              {item.mpe !== undefined
                                ? `±${Number(item.mpe).toFixed(4)} ${unit}`
                                : '—'}
                            </strong>
                          </div>
                        </div>

                        <div className="sih-repeatability-table-wrap">
                          <table className="sih-repeatability-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>TEST LOAD</th>
                                <th>INDICATION</th>
                                <th>CALCULATED ERROR</th>
                              </tr>
                            </thead>
                            <tbody>
                              {observations.map((load, index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>{Number(load).toFixed(3)} {unit}</td>
                                  <td>
                                    {item.indications?.[index] !== undefined
                                      ? `${Number(item.indications[index]).toFixed(3)} ${unit}`
                                      : '—'}
                                  </td>
                                  <td>
                                    {errors[index] !== undefined
                                      ? `${Number(errors[index]) >= 0 ? '+' : ''}${Number(errors[index]).toFixed(4)} ${unit}`
                                      : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()
          ) : (
            <div className="sih-result-details-row">
              <div className="sih-result-metric">
                <span>MEASURED ERROR</span>
                <strong>{result.measured_error !== undefined && result.measured_error !== null ? `${Number(result.measured_error).toFixed(4)} ${instrument?.unit || 'kg'}` : '0.0000 kg'}</strong>
              </div>
              <div className="sih-result-metric">
                <span>MPE LIMIT</span>
                <strong>{result.mpe_value !== undefined && result.mpe_value !== null ? `±${Number(result.mpe_value).toFixed(4)} ${instrument?.unit || 'kg'}` : '±0.0050 kg'}</strong>
              </div>
              <div className="sih-result-metric evaluation">
                <span>EVALUATION</span>
                <strong className="sih-result-reason">
                  {result.failure_reason || (result.pass_fail ? 'Within permitted error limits.' : 'Exceeds maximum permissible error limits.')}
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error banner if execution failed */}
      {error && (
        <div className="sih-form-error-banner">
          <span className="sih-error-icon">⚠️</span>
          <div className="sih-error-text">
            <strong>Execution Error</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Observations Section Header */}
      <div className="sih-observations-header">
        <div className="sih-obs-title-group">
          <span className="sih-obs-badge">INPUT OBSERVATIONS</span>
          <h4>Required Test Measurements</h4>
        </div>
        <span className="sih-unit-hint">Unit: {instrument?.unit || 'kg'}</span>
      </div>

      {code === 'WEIGHING_PERFORMANCE' && (
        <>
          <p className="r76-form-help">
            OIML R 76-1:2006 A.4.4.1 requires at least 10 different
            test loads for the initial intrinsic error test, including
            zero/Min and Max.
          </p>

          <div className="r76-observation-table">
            <div className="r76-observation-head">
              <span>#</span>
              <span>Load</span>
              <span>Indication</span>
              <span>ΔL</span>
            </div>

            {weighingRows.map((row, index) => (
              <div className="r76-observation-row" key={index}>
                <strong>{index + 1}</strong>

                <input
                  type="number"
                  step="any"
                  value={row.load}
                  onChange={(event) =>
                    setWeighingRows((rows) =>
                      rows.map((item, i) =>
                        i === index
                          ? { ...item, load: event.target.value }
                          : item,
                      ),
                    )
                  }
                />

                <input
                  type="number"
                  step="any"
                  value={row.indication}
                  onChange={(event) =>
                    setWeighingRows((rows) =>
                      rows.map((item, i) =>
                        i === index
                          ? { ...item, indication: event.target.value }
                          : item,
                      ),
                    )
                  }
                />

                <input
                  type="number"
                  step="any"
                  value={row.additional_load}
                  onChange={(event) =>
                    setWeighingRows((rows) =>
                      rows.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              additional_load: event.target.value,
                            }
                          : item,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}

{code === 'DISCRIMINATION' && (
        <>
          <p className="r76-form-help">
            OIML R 76-1:2006 A.4.8 requires discrimination to be
            checked at three load conditions: Min, approximately
            1/2 Max, and Max. Every condition must pass.
          </p>

          <div className="r76-input-grid">
            <label>
              Discrimination type
              <select
                value={values.discrimination_type}
                onChange={(event) =>
                  setValue(
                    'discrimination_type',
                    event.target.value,
                  )
                }
              >
                <option value="digital">Digital</option>
                <option value="analog">Analog</option>
                <option value="non_self_indicating">
                  Non-self-indicating
                </option>
              </select>
            </label>

            {values.discrimination_type !== 'digital' && (
              <Field
                label="MPE override (optional)"
                value={values.mpe_override}
                onChange={(v) =>
                  setValue('mpe_override', v)
                }
              />
            )}
          </div>

          <div className="r76-observation-table">
            <div className="r76-observation-head">
              <span>Condition</span>
              <span>Load</span>
              {values.discrimination_type !==
                'non_self_indicating' && (
                <>
                  <span>Initial indication</span>
                  <span>Final indication</span>
                </>
              )}
              {values.discrimination_type ===
                'non_self_indicating' && (
                <span>Visible displacement</span>
              )}
            </div>

            {discriminationRows.map((row, index) => (
              <div
                className="r76-observation-row"
                key={index}
              >
                <strong>
                  {index === 0
                    ? 'Min'
                    : index === 1
                      ? '1/2 Max'
                      : 'Max'}
                </strong>

                <input
                  type="number"
                  step="any"
                  value={row.load}
                  onChange={(event) =>
                    setDiscriminationRows((rows) =>
                      rows.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              load: event.target.value,
                            }
                          : item,
                      ),
                    )
                  }
                />

                {values.discrimination_type !==
                  'non_self_indicating' && (
                  <>
                    <input
                      type="number"
                      step="any"
                      value={row.initial_indication}
                      onChange={(event) =>
                        setDiscriminationRows((rows) =>
                          rows.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  initial_indication:
                                    event.target.value,
                                }
                              : item,
                          ),
                        )
                      }
                    />

                    <input
                      type="number"
                      step="any"
                      value={row.final_indication}
                      onChange={(event) =>
                        setDiscriminationRows((rows) =>
                          rows.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  final_indication:
                                    event.target.value,
                                }
                              : item,
                          ),
                        )
                      }
                    />
                  </>
                )}

                {values.discrimination_type ===
                  'non_self_indicating' && (
                  <select
                    value={row.visible_displacement}
                    onChange={(event) =>
                      setDiscriminationRows((rows) =>
                        rows.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                visible_displacement:
                                  event.target.value,
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                )}
              </div>
            ))}
          </div>

          <div className="r76-calculated-box">
            <span>Scale interval d</span>
            <strong>
              {d !== undefined ? `${d} ${instrument.unit ?? ''}` : '—'}
            </strong>
            <small>
              Digital discrimination uses the 5 mg applicability
              threshold and d-based indication change requirement.
            </small>
          </div>
        </>
      )}

{code === 'SENSITIVITY' && (
        <>
          <div className="r76-calculated-box">
            <span>Required permanent displacement</span>
            <strong>
              {accuracyClass === 'I' ||
              accuracyClass === 'II'
                ? '1 mm'
                : instrument.max_capacity !== undefined &&
                    instrument.max_capacity <= 30
                  ? '2 mm'
                  : '5 mm'}
            </strong>
            <small>
              Requirement determined from accuracy class
              and Max.
            </small>
          </div>

          <div className="r76-input-grid">
            <Field
              label="Permanent displacement (mm)"
              value={values.permanent_displacement_mm}
              onChange={(v) =>
                setValue(
                  'permanent_displacement_mm',
                  v,
                )
              }
            />
          </div>

          <div className="r76-calculated-box">
            <span>MPE used by test</span>
            <strong>
              {maxMPE !== undefined ? `±${maxMPE}` : '—'}
            </strong>
          </div>
        </>
      )}

      {code === 'REPEATABILITY' && (
        <>
          <p className="r76-form-help">
            OIML R 76 type-approval repeatability requires two series:
            one at approximately 50% Max and one at approximately Max.
            For Max below 1000 kg, enter 10 weighings in each series.
          </p>

          {[0, 1].map((seriesIndex) => {
            const offset = seriesIndex * 10
            const targetLoad =
              seriesIndex === 0
                ? (instrument?.max_capacity ?? 0) / 2
                : (instrument?.max_capacity ?? 0)

            return (
              <div key={seriesIndex}>
                <h4 className="r76-section-title">
                  Series {seriesIndex + 1} — approximately{' '}
                  {seriesIndex === 0 ? '50% Max' : '100% Max'}
                  {' '}({targetLoad || '—'})
                </h4>

                <div className="r76-observation-table">
                  <div className="r76-observation-head">
                    <span>#</span>
                    <span>Load</span>
                    <span>Indication</span>
                    <span>ΔL</span>
                  </div>

                  {repeatRows
                    .slice(offset, offset + 10)
                    .map((row, localIndex) => {
                      const index = offset + localIndex

                      return (
                        <div
                          className="r76-observation-row"
                          key={index}
                        >
                          <strong>{localIndex + 1}</strong>

                          <input
                            type="number"
                            step="any"
                            value={row.load}
                            onChange={(event) => {
                              const next = [...repeatRows]
                              next[index] = {
                                ...next[index],
                                load: event.target.value,
                              }
                              setRepeatRows(next)
                            }}
                          />

                          <input
                            type="number"
                            step="any"
                            value={row.indication}
                            onChange={(event) => {
                              const next = [...repeatRows]
                              next[index] = {
                                ...next[index],
                                indication: event.target.value,
                              }
                              setRepeatRows(next)
                            }}
                          />

                          <input
                            type="number"
                            step="any"
                            value={row.additional_load}
                            onChange={(event) => {
                              const next = [...repeatRows]
                              next[index] = {
                                ...next[index],
                                additional_load:
                                  event.target.value,
                              }
                              setRepeatRows(next)
                            }}
                          />
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}

          <div className="r76-calculated-box">
            <span>MPE for current load</span>
            <strong>
              {weighingMPE !== undefined
                ? `±${weighingMPE}`
                : '—'}
            </strong>
          </div>
        </>
      )}

      {code === 'CREEP' && (
        <div className="r76-input-grid">
          <Field
            label="Initial error"
            value={values.initial_error}
            onChange={(v) =>
              setValue('initial_error', v)
            }
          />

          <Field
            label="Error at 15 minutes"
            value={values.error_at_15_min}
            onChange={(v) =>
              setValue('error_at_15_min', v)
            }
          />

          <Field
            label="Error at 30 minutes"
            value={values.error_at_30_min}
            onChange={(v) =>
              setValue('error_at_30_min', v)
            }
          />

          <Field
            label="Temperature change °C"
            value={values.temperature_change}
            onChange={(v) =>
              setValue('temperature_change', v)
            }
          />

          <Field
            label="Duration minutes"
            value={values.duration_minutes}
            onChange={(v) =>
              setValue('duration_minutes', v)
            }
          />

          <div className="r76-calculated-box">
            <span>Scale interval e</span>
            <strong>{e ?? '—'}</strong>
          </div>
        </div>
      )}

      {code === 'TILT' && (
        <>
          <p className="r76-form-help">
            Record the reference-position indications and the
            indications at the limiting tilt in all required
            directions. Loaded differences are corrected for the
            zero deviation at the tilted position.
          </p>

          <div className="r76-input-grid">
            <Field
              label="Reference zero indication"
              value={values.tilt_reference_zero}
              onChange={(v) =>
                setValue('tilt_reference_zero', v)
              }
            />

            <Field
              label="Low test load"
              value={values.tilt_low_load}
              onChange={(v) =>
                setValue('tilt_low_load', v)
              }
            />

            <Field
              label="Reference low-load indication"
              value={values.tilt_reference_low_indication}
              onChange={(v) =>
                setValue(
                  'tilt_reference_low_indication',
                  v,
                )
              }
            />

            <Field
              label="Reference Max indication"
              value={values.tilt_reference_max_indication}
              onChange={(v) =>
                setValue(
                  'tilt_reference_max_indication',
                  v,
                )
              }
            />
          </div>

          <div className="r76-calculated-box">
            <span>No-load tilt limit</span>
            <strong>
              {e !== undefined
                ? `±${(2 * e).toFixed(6)}`
                : '—'}
            </strong>
            <small>
              2e — not applicable to the class-II
              exception described by R76.
            </small>
          </div>

          {[
            [
              'Longitudinal forward',
              'tilt_longitudinal_forward',
            ],
            [
              'Longitudinal backward',
              'tilt_longitudinal_backward',
            ],
            [
              'Transverse left',
              'tilt_transverse_left',
            ],
            [
              'Transverse right',
              'tilt_transverse_right',
            ],
          ].map(([label, prefix]) => (
            <div
              key={prefix}
              className="r76-test-subsection"
            >
              <h4>{label}</h4>

              <div className="r76-input-grid">
                <Field
                  label="Tilted zero indication"
                  value={
                    values[
                      `${prefix}_zero`
                    ]
                  }
                  onChange={(v) =>
                    setValue(
                      `${prefix}_zero`,
                      v,
                    )
                  }
                />

                <Field
                  label="Tilted low-load indication"
                  value={
                    values[
                      `${prefix}_low`
                    ]
                  }
                  onChange={(v) =>
                    setValue(
                      `${prefix}_low`,
                      v,
                    )
                  }
                />

                <Field
                  label="Tilted Max indication"
                  value={
                    values[
                      `${prefix}_max`
                    ]
                  }
                  onChange={(v) =>
                    setValue(
                      `${prefix}_max`,
                      v,
                    )
                  }
                />
              </div>
            </div>
          ))}

          <div className="r76-calculated-box">
            <span>Loaded limits</span>
            <strong>
              Compare each corrected low-load and Max
              difference with its applicable MPE.
            </strong>
            <small>
              OIML R 76-1:2006 — 3.9.1.1 / A.5.1
            </small>
          </div>
        </>
      )}

      {code === 'WARM_UP' && (
        <>
          <p className="r76-form-help">
            R76 requires the instrument to be disconnected
            for at least 8 hours, then observations at
            start, 5, 15 and 30 minutes.
          </p>

          <div className="r76-input-grid">
            <Field
              label="Disconnection before test (hours)"
              value={values.warmup_disconnected_hours}
              onChange={(v) =>
                setValue(
                  'warmup_disconnected_hours',
                  v,
                )
              }
            />

            <label className="r76-field">
              <span>Weighing result available during warm-up?</span>
              <select
                value={values.warmup_result_available}
                onChange={(event) =>
                  setValue(
                    'warmup_result_available',
                    event.target.value,
                  )
                }
                disabled={disabled}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
          </div>

          {[
            ['0', 'Start'],
            ['5', '5 minutes'],
            ['15', '15 minutes'],
            ['30', '30 minutes'],
          ].map(([minute, label]) => (
            <div
              key={minute}
              className="r76-test-subsection"
            >
              <h4>{label}</h4>

              <div className="r76-input-grid">
                <Field
                  label="Zero error E₀"
                  value={
                    values[
                      `warmup_zero_${minute}`
                    ]
                  }
                  onChange={(v) =>
                    setValue(
                      `warmup_zero_${minute}`,
                      v,
                    )
                  }
                />

                <Field
                  label="Load L"
                  value={
                    values[
                      `warmup_load_${minute}`
                    ]
                  }
                  onChange={(v) =>
                    setValue(
                      `warmup_load_${minute}`,
                      v,
                    )
                  }
                />

                <Field
                  label="Indication I"
                  value={
                    values[
                      `warmup_indication_${minute}`
                    ]
                  }
                  onChange={(v) =>
                    setValue(
                      `warmup_indication_${minute}`,
                      v,
                    )
                  }
                />

                <Field
                  label="Additional load ΔL"
                  value={
                    values[
                      `warmup_additional_${minute}`
                    ]
                  }
                  onChange={(v) =>
                    setValue(
                      `warmup_additional_${minute}`,
                      v,
                    )
                  }
                />
              </div>
            </div>
          ))}

          <div className="r76-calculated-box">
            <span>Pass criterion</span>
            <strong>
              |Eₗ − E₀| ≤ |mpe|
            </strong>
            <small>
              OIML R 76-2:2007 — Warm-up time, A.5.2
            </small>
          </div>
        </>
      )}

      {code === 'ZERO_RANGE' && (
        <>
          <p className="r76-form-help">
            Record the measured positive and negative portions of
            the initial zero-setting range, plus the overall effect
            of zero-setting and zero-tracking.
          </p>

          <div className="r76-input-grid">
            <Field
              label="Positive initial range"
              value={values.zero_positive_range}
              onChange={(v) =>
                setValue('zero_positive_range', v)
              }
            />

            <Field
              label="Negative initial range"
              value={values.zero_negative_range}
              onChange={(v) =>
                setValue('zero_negative_range', v)
              }
            />

            <Field
              label="Overall zero-setting range"
              value={values.zero_overall_range}
              onChange={(v) =>
                setValue('zero_overall_range', v)
              }
            />
          </div>

          <div className="r76-calculated-box">
            <span>Initial zero-setting range</span>
            <strong>
              {(
                numberOrZero(values.zero_positive_range) +
                numberOrZero(values.zero_negative_range)
              ).toFixed(4)}
            </strong>

            <small>
              Limit: 20% of Max ={' '}
              {instrument.max_capacity !== undefined
                ? (instrument.max_capacity * 0.20).toFixed(4)
                : '—'}
            </small>
          </div>

          <div className="r76-calculated-box">
            <span>Overall zero-setting + zero-tracking limit</span>
            <strong>
              {instrument.max_capacity !== undefined
                ? `${(instrument.max_capacity * 0.04).toFixed(4)} ${instrument.unit || ''}`
                : '—'}
            </strong>

            <small>
              OIML R 76-1:2006 — 4.5.1
            </small>
          </div>
        </>
      )}

      {code === 'ZERO_ACCURACY' && (
        <>
          <p className="r76-form-help">
            Record the changeover-point observation used to
            determine the error at zero. The calculation follows
            OIML R 76-1 A.4.4.3.
          </p>

          <div className="r76-input-grid">
            <Field
              label="Load L"
              value={values.zero_accuracy_load}
              onChange={(v) =>
                setValue('zero_accuracy_load', v)
              }
            />

            <Field
              label="Indication I"
              value={values.zero_accuracy_indication}
              onChange={(v) =>
                setValue('zero_accuracy_indication', v)
              }
            />

            <Field
              label="Additional load ΔL"
              value={values.zero_accuracy_additional_load}
              onChange={(v) =>
                setValue(
                  'zero_accuracy_additional_load',
                  v,
                )
              }
            />
          </div>

          <div className="r76-calculated-box">
            <span>Scale interval e</span>
            <strong>{e ?? '—'}</strong>

            <small>
              Zero-error limit: ±0.25e ={' '}
              {e !== undefined
                ? `±${(0.25 * e).toFixed(6)}`
                : '—'}
            </small>
          </div>

          <div className="r76-calculated-box">
            <span>Calculation</span>
            <strong>
              E₀ = I + ½e − ΔL − L
            </strong>

            <small>
              OIML R 76-1:2006 — A.4.2.3 / A.4.4.3
            </small>
          </div>
        </>
      )}

      {code === 'ZERO_RETURN' && (
        <>
          <div className="r76-input-grid">
            <Field
              label="Initial indication"
              value={values.initial_indication_zero}
              onChange={(v) =>
                setValue(
                  'initial_indication_zero',
                  v,
                )
              }
            />

            <Field
              label="Initial ΔL"
              value={values.initial_additional_load}
              onChange={(v) =>
                setValue(
                  'initial_additional_load',
                  v,
                )
              }
            />

            <Field
              label="30-minute indication"
              value={values.indication_30_min}
              onChange={(v) =>
                setValue(
                  'indication_30_min',
                  v,
                )
              }
            />

            <Field
              label="30-minute ΔL"
              value={values.additional_load_30_min}
              onChange={(v) =>
                setValue(
                  'additional_load_30_min',
                  v,
                )
              }
            />

            <Field
              label="35-minute indication (optional)"
              value={values.indication_35_min}
              onChange={(v) =>
                setValue(
                  'indication_35_min',
                  v,
                )
              }
            />

            <Field
              label="35-minute ΔL (optional)"
              value={values.additional_load_35_min}
              onChange={(v) =>
                setValue(
                  'additional_load_35_min',
                  v,
                )
              }
            />

            <Field
              label="e₁ (optional)"
              value={values.e1}
              onChange={(v) => setValue('e1', v)}
            />
          </div>

          <div className="r76-calculated-box">
            <span>Scale interval e</span>
            <strong>{e ?? '—'}</strong>
          </div>
        </>
      )}

      {(code === 'VOLTAGE_AC' ||
        code === 'VOLTAGE_EXTERNAL' ||
        code === 'VOLTAGE_BATTERY' ||
        code === 'VOLTAGE_VEHICLE') && (
        <>
          <div className="r76-input-grid">
            <Field
              label="Nominal voltage Uₙₒₘ (V)"
              value={values.voltage_nominal}
              onChange={(v) => setValue('voltage_nominal', v)}
            />
            <Field
              label="Lower voltage limit (V)"
              value={values.voltage_lower}
              onChange={(v) => setValue('voltage_lower', v)}
            />
            <Field
              label="Upper voltage limit (V)"
              value={values.voltage_upper}
              onChange={(v) => setValue('voltage_upper', v)}
            />
          </div>

          <div className="r76-calculated-box">
            <span>OIML R76 voltage severity</span>
            <strong>
              {code === 'VOLTAGE_AC'
                ? '0.85 Uₙₒₘ → 1.10 Uₙₒₘ'
                : code === 'VOLTAGE_EXTERNAL'
                  ? 'Minimum operating voltage → 1.20 Uₙₒₘ'
                  : code === 'VOLTAGE_BATTERY'
                    ? 'Minimum operating voltage → Uₙₒₘ'
                    : '12 V → 16 V / 24 V → 32 V'}
            </strong>
            <small>
              Test loads: 10e and one load between ½ Max and Max.
            </small>
          </div>

          <h3>Reference voltage</h3>
          <div className="r76-input-grid">
            <Field
              label="10e load"
              value={values.voltage_reference_10e_load}
              onChange={(v) =>
                setValue('voltage_reference_10e_load', v)
              }
            />
            <Field
              label="10e indication"
              value={values.voltage_reference_10e_indication}
              onChange={(v) =>
                setValue('voltage_reference_10e_indication', v)
              }
            />
            <Field
              label="10e additional load ΔL"
              value={values.voltage_reference_10e_additional}
              onChange={(v) =>
                setValue('voltage_reference_10e_additional', v)
              }
            />
            <Field
              label="10e zero error E₀"
              value={values.voltage_reference_10e_zero}
              onChange={(v) =>
                setValue('voltage_reference_10e_zero', v)
              }
            />
            <Field
              label="High load"
              value={values.voltage_reference_high_load}
              onChange={(v) =>
                setValue('voltage_reference_high_load', v)
              }
            />
            <Field
              label="High-load indication"
              value={values.voltage_reference_high_indication}
              onChange={(v) =>
                setValue('voltage_reference_high_indication', v)
              }
            />
            <Field
              label="High-load additional ΔL"
              value={values.voltage_reference_high_additional}
              onChange={(v) =>
                setValue('voltage_reference_high_additional', v)
              }
            />
            <Field
              label="High-load zero error E₀"
              value={values.voltage_reference_high_zero}
              onChange={(v) =>
                setValue('voltage_reference_high_zero', v)
              }
            />
          </div>

          <h3>Lower voltage limit</h3>
          <div className="r76-input-grid">
            <Field
              label="10e load"
              value={values.voltage_lower_10e_load}
              onChange={(v) =>
                setValue('voltage_lower_10e_load', v)
              }
            />
            <Field
              label="10e indication"
              value={values.voltage_lower_10e_indication}
              onChange={(v) =>
                setValue('voltage_lower_10e_indication', v)
              }
            />
            <Field
              label="10e additional load ΔL"
              value={values.voltage_lower_10e_additional}
              onChange={(v) =>
                setValue('voltage_lower_10e_additional', v)
              }
            />
            <Field
              label="10e zero error E₀"
              value={values.voltage_lower_10e_zero}
              onChange={(v) =>
                setValue('voltage_lower_10e_zero', v)
              }
            />
            <Field
              label="High load"
              value={values.voltage_lower_high_load}
              onChange={(v) =>
                setValue('voltage_lower_high_load', v)
              }
            />
            <Field
              label="High-load indication"
              value={values.voltage_lower_high_indication}
              onChange={(v) =>
                setValue('voltage_lower_high_indication', v)
              }
            />
            <Field
              label="High-load additional ΔL"
              value={values.voltage_lower_high_additional}
              onChange={(v) =>
                setValue('voltage_lower_high_additional', v)
              }
            />
            <Field
              label="High-load zero error E₀"
              value={values.voltage_lower_high_zero}
              onChange={(v) =>
                setValue('voltage_lower_high_zero', v)
              }
            />
          </div>

          <h3>Upper voltage limit</h3>
          <div className="r76-input-grid">
            <Field
              label="10e load"
              value={values.voltage_upper_10e_load}
              onChange={(v) =>
                setValue('voltage_upper_10e_load', v)
              }
            />
            <Field
              label="10e indication"
              value={values.voltage_upper_10e_indication}
              onChange={(v) =>
                setValue('voltage_upper_10e_indication', v)
              }
            />
            <Field
              label="10e additional load ΔL"
              value={values.voltage_upper_10e_additional}
              onChange={(v) =>
                setValue('voltage_upper_10e_additional', v)
              }
            />
            <Field
              label="10e zero error E₀"
              value={values.voltage_upper_10e_zero}
              onChange={(v) =>
                setValue('voltage_upper_10e_zero', v)
              }
            />
            <Field
              label="High load"
              value={values.voltage_upper_high_load}
              onChange={(v) =>
                setValue('voltage_upper_high_load', v)
              }
            />
            <Field
              label="High-load indication"
              value={values.voltage_upper_high_indication}
              onChange={(v) =>
                setValue('voltage_upper_high_indication', v)
              }
            />
            <Field
              label="High-load additional ΔL"
              value={values.voltage_upper_high_additional}
              onChange={(v) =>
                setValue('voltage_upper_high_additional', v)
              }
            />
            <Field
              label="High-load zero error E₀"
              value={values.voltage_upper_high_zero}
              onChange={(v) =>
                setValue('voltage_upper_high_zero', v)
              }
            />
          </div>

          <div className="r76-calculated-box">
            <span>Pass criterion</span>
            <strong>|Ec| ≤ |MPE|</strong>
            <small>
              E = I + ½e − ΔL − L; Ec = E − E₀
            </small>
          </div>
        </>
      )}

      {code === 'TEMPERATURE_STATIC' && (
        <section>
          <h3>Static Temperature Test</h3>

          <p>
            OIML R 76-1:2006 A.5.3.1 — perform weighing
            tests at the specified static temperatures.
          </p>

          <p>
            Each observation is evaluated using the normal
            R76 weighing-error and maximum permissible error
            calculation.
          </p>

          <table>
            <thead>
              <tr>
                <th>Test Point</th>
                <th>Temperature °C</th>
                <th>Load</th>
                <th>Indication</th>
                <th>Additional Load ΔL</th>
                <th>Zero Error E0</th>
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3, 4, 5].map((index) => {
                const labels: Record<number, string> = {
                  1: 'Reference 1',
                  2: 'High',
                  3: 'Low',
                  4: '5°C',
                  5: 'Reference 2',
                }

                const optional = index === 4
                const included =
                  !optional ||
                  values.temperature_static_include_4 === 'true'

                return (
                  <tr key={index}>
                    <td>
                      <strong>{labels[index]}</strong>

                      {optional && (
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              values.temperature_static_include_4 ===
                              'true'
                            }
                            onChange={(event) =>
                              setValue(
                                'temperature_static_include_4',
                                event.target.checked
                                  ? 'true'
                                  : 'false',
                              )
                            }
                          />
                          {' '}Include
                        </label>
                      )}
                    </td>

                    <td>
                      <input
                        type="number"
                        step="any"
                        disabled={!included}
                        value={
                          values[
                            `temperature_static_reference_${index}`
                          ]
                        }
                        onChange={(event) =>
                          setValue(
                            `temperature_static_reference_${index}`,
                            event.target.value,
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="any"
                        disabled={!included}
                        value={
                          values[
                            `temperature_static_load_${index}`
                          ]
                        }
                        onChange={(event) =>
                          setValue(
                            `temperature_static_load_${index}`,
                            event.target.value,
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="any"
                        disabled={!included}
                        value={
                          values[
                            `temperature_static_indication_${index}`
                          ]
                        }
                        onChange={(event) =>
                          setValue(
                            `temperature_static_indication_${index}`,
                            event.target.value,
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="any"
                        disabled={!included}
                        value={
                          values[
                            `temperature_static_additional_${index}`
                          ]
                        }
                        onChange={(event) =>
                          setValue(
                            `temperature_static_additional_${index}`,
                            event.target.value,
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="any"
                        disabled={!included}
                        value={
                          values[
                            `temperature_static_zero_${index}`
                          ]
                        }
                        onChange={(event) =>
                          setValue(
                            `temperature_static_zero_${index}`,
                            event.target.value,
                          )
                        }
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <p>
            The 5°C point is included when required by the
            specified low temperature condition.
          </p>

          <p>
            The backend calculates MPE separately for each
            load and evaluates the corrected weighing error
            against that MPE.
          </p>
        </section>
      )}

      {code === 'TEMPERATURE_ZERO' && (
        <>
          <div className="r76-form-help">
            <strong>OIML R 76-1:2006 — A.5.3.2</strong>
            <br />
            Record zero indications at the required temperature
            points. Automatic zero-setting and zero-tracking must
            not operate during these measurements, and the
            instrument must not be preloaded.
          </div>

          <div className="r76-observation-table">
            <div className="r76-observation-head">
              <span>Temperature °C</span>
              <span>Indication</span>
              <span>Additional load ΔL</span>
            </div>

            {[1, 2, 3, 4].map((index) => (
              <div
                className="r76-observation-row"
                key={index}
              >
                <input
                  type="number"
                  step="any"
                  value={values[`temperature_${index}`]}
                  onChange={(event) =>
                    setValue(
                      `temperature_${index}`,
                      event.target.value,
                    )
                  }
                  placeholder={`Temperature ${index}`}
                />

                <input
                  type="number"
                  step="any"
                  value={values[`indication_${index}`]}
                  onChange={(event) =>
                    setValue(
                      `indication_${index}`,
                      event.target.value,
                    )
                  }
                  placeholder="Indication"
                />

                <input
                  type="number"
                  step="any"
                  value={values[`additional_load_${index}`]}
                  onChange={(event) =>
                    setValue(
                      `additional_load_${index}`,
                      event.target.value,
                    )
                  }
                  placeholder="ΔL"
                />
              </div>
            ))}
          </div>

          <div className="r76-calculated-box">
            <span>Required temperature interval</span>
            <strong>
              {accuracyClass === 'I' ? '1 °C' : '5 °C'}
            </strong>
            <small>
              Each consecutive temperature pair is normalized
              to the required interval and checked against e.
            </small>
          </div>

          <div className="r76-calculated-box">
            <span>Calculation</span>
            <strong>
              P = I + ½e − ΔL
            </strong>
            <small>
              ΔP is calculated for each consecutive temperature
              pair. The result passes only when every interval
              satisfies the OIML limit.
            </small>
          </div>
        </>
      )}

      {code === 'ENDURANCE' && (
        <section className="r76-special-test">
          <div className="r76-test-help">
            <strong>OIML R 76-1:2006 — A.6 Endurance</strong>
            <p>
              Applicable to Class II, III and IIII instruments with Max ≤ 100 kg.
              Perform the A.4.4.1 weighing test before and after 100,000 cycles.
            </p>
          </div>

          <div className="r76-input-grid">
            <label>
              Number of cycles
              <input
                type="number"
                value={values.endurance_cycles}
                onChange={(event) =>
                  setValue('endurance_cycles', event.target.value)
                }
              />
            </label>
          </div>

          <h4 className="r76-section-title">
            Before endurance — A.4.4.1 weighing test
          </h4>

          <div className="r76-observation-table">
            <div className="r76-observation-head">
              <span>#</span>
              <span>Load</span>
              <span>Indication</span>
              <span>ΔL</span>
              <span>Zero error</span>
            </div>

            {enduranceBeforeRows.map((row, index) => (
              <div className="r76-observation-row" key={`before-${index}`}>
                <strong>{index + 1}</strong>

                <input
                  type="number"
                  step="any"
                  value={row.load}
                  onChange={(event) =>
                    setEnduranceBeforeRows((rows) =>
                      rows.map((item, i) =>
                        i === index
                          ? { ...item, load: event.target.value }
                          : item,
                      ),
                    )
                  }
                />

                <input
                  type="number"
                  step="any"
                  value={row.indication}
                  onChange={(event) =>
                    setEnduranceBeforeRows((rows) =>
                      rows.map((item, i) =>
                        i === index
                          ? { ...item, indication: event.target.value }
                          : item,
                      ),
                    )
                  }
                />

                <input
                  type="number"
                  step="any"
                  value={row.additional_load}
                  onChange={(event) =>
                    setEnduranceBeforeRows((rows) =>
                      rows.map((item, i) =>
                        i === index
                          ? { ...item, additional_load: event.target.value }
                          : item,
                      ),
                    )
                  }
                />

                <input
                  type="number"
                  step="any"
                  value={enduranceBeforeZero[index] ?? ''}
                  onChange={(event) =>
                    setEnduranceBeforeZero((rows) =>
                      rows.map((value, i) =>
                        i === index ? event.target.value : value,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>

          <h4 className="r76-section-title">
            After 100,000 cycles — A.4.4.1 weighing test
          </h4>

          <div className="r76-observation-table">
            <div className="r76-observation-head">
              <span>#</span>
              <span>Load</span>
              <span>Indication</span>
              <span>ΔL</span>
              <span>Zero error</span>
            </div>

            {enduranceAfterRows.map((row, index) => (
              <div className="r76-observation-row" key={`after-${index}`}>
                <strong>{index + 1}</strong>

                <input
                  type="number"
                  step="any"
                  value={row.load}
                  onChange={(event) =>
                    setEnduranceAfterRows((rows) =>
                      rows.map((item, i) =>
                        i === index
                          ? { ...item, load: event.target.value }
                          : item,
                      ),
                    )
                  }
                />

                <input
                  type="number"
                  step="any"
                  value={row.indication}
                  onChange={(event) =>
                    setEnduranceAfterRows((rows) =>
                      rows.map((item, i) =>
                        i === index
                          ? { ...item, indication: event.target.value }
                          : item,
                      ),
                    )
                  }
                />

                <input
                  type="number"
                  step="any"
                  value={row.additional_load}
                  onChange={(event) =>
                    setEnduranceAfterRows((rows) =>
                      rows.map((item, i) =>
                        i === index
                          ? { ...item, additional_load: event.target.value }
                          : item,
                      ),
                    )
                  }
                />

                <input
                  type="number"
                  step="any"
                  value={enduranceAfterZero[index] ?? ''}
                  onChange={(event) =>
                    setEnduranceAfterZero((rows) =>
                      rows.map((value, i) =>
                        i === index ? event.target.value : value,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>

          <p className="r76-test-note">
            A.4.4.1 requires at least 10 different test loads for the
            initial intrinsic error test, including zero/Min and Max.
          </p>
        </section>
      )}

      {/* Dynamic schema inputs & NO MANUAL OBSERVATION REQUIRED box for procedures without custom hard-coded forms */}
      {!['WEIGHING_PERFORMANCE', 'ECCENTRIC_LOADING', 'DISCRIMINATION', 'SENSITIVITY', 'REPEATABILITY', 'CREEP', 'ZERO_RETURN', 'TILTING_STATIC', 'TILTING_MOBILE', 'WARM_UP', 'ZERO_RANGE', 'ZERO_ACCURACY', 'VOLTAGE_AC', 'VOLTAGE_EXTERNAL', 'VOLTAGE_BATTERY', 'VOLTAGE_VEHICLE', 'ENDURANCE', 'TEMPERATURE_STATIC', 'TEMPERATURE_ZERO'].includes(code) && (
        definition.no_manual_observation_required ? (
          <div className="sih-no-manual-box">
            <div className="sih-no-manual-icon">ℹ️</div>
            <div className="sih-no-manual-content">
              <strong>NO MANUAL OBSERVATION REQUIRED</strong>
              <p>{definition.no_manual_reason || 'This procedure evaluates compliance deterministically using registered instrument parameters and verification rules.'}</p>
              <span className="sih-no-manual-sub">
                Registered Instrument: {instrument?.manufacturer} {instrument?.model} • Class {instrument?.accuracy_class || 'III'} • Max {instrument?.max_capacity} {instrument?.unit || 'kg'} • e={instrument?.e} {instrument?.unit || 'kg'} • d={instrument?.d} {instrument?.unit || 'kg'}
              </span>
            </div>
          </div>
        ) : (
          <div className="sih-generic-obs-form">
            {workflow === 'inspection' && (
              <>
                <div className="sih-input-grid">
                  <Field
                    label="Compliance Status"
                    value={values.inspection_passed || ''}
                    onChange={(v) => setValue('inspection_passed', v)}
                    type="select"
                    options={[
                      { label: 'Pass (Satisfies OIML R 76 requirements)', value: 'true' },
                      { label: 'Fail (Non-compliant)', value: 'false' },
                    ]}
                    helpText="Record the result of the visual, marking, software, or checklist inspection."
                  />
                </div>
              </>
            )}

            {code === 'ZERO_TRACKING' ? (
              <div className="sih-input-grid">
                <Field
                  label="Test Load (L)"
                  value={values.zero_tracking_load || ''}
                  onChange={(v) => setValue('zero_tracking_load', v)}
                  type="number"
                  step="any"
                  unit={instrument?.unit || 'kg'}
                  helpText="Load used to bring the indication outside the automatic zero-tracking range."
                />

                <Field
                  label="Indication (I)"
                  value={values.zero_tracking_indication || ''}
                  onChange={(v) => setValue('zero_tracking_indication', v)}
                  type="number"
                  step="any"
                  unit={instrument?.unit || 'kg'}
                  helpText="Indication observed at the test load before applying the additional load."
                />

                <Field
                  label="Additional Load (ΔL)"
                  value={values.zero_tracking_additional_load || ''}
                  onChange={(v) => setValue('zero_tracking_additional_load', v)}
                  type="number"
                  step="any"
                  unit={instrument?.unit || 'kg'}
                  helpText="Additional load required to cause the indication to change by one scale interval."
                />

                <Field
                  label="Zero-Tracking Correction Rate"
                  value={values.zero_tracking_rate || ''}
                  onChange={(v) => setValue('zero_tracking_rate', v)}
                  type="number"
                  step="any"
                  unit={`${instrument?.d || instrument?.e || '1'} / second`}
                  helpText="Observed zero-tracking correction rate. Maximum permitted rate is 0.5 d/s."
                />

                <Field
                  label="Equilibrium Stable"
                  value={values.zero_tracking_equilibrium || ''}
                  onChange={(v) => setValue('zero_tracking_equilibrium', v)}
                  type="select"
                  options={[
                    { label: 'Yes — stable equilibrium', value: 'true' },
                    { label: 'No — unstable equilibrium', value: 'false' },
                  ]}
                  helpText="Confirm that stable equilibrium is reached before zero tracking operates."
                />
              </div>
            ) : workflow === 'metrological' ? (
              <div className="sih-input-grid">
                <Field
                  label="Measured Error"
                  value={values.measured_error || ''}
                  onChange={(v) => setValue('measured_error', v)}
                  type="number"
                  step="any"
                  unit={instrument?.unit || 'kg'}
                  helpText="Enter the observed measurement error. The backend calculates MPE compliance."
                />
              </div>
            ) : null}

            {workflow === 'influence' && (
              <div className="sih-input-grid">
                <Field
                  label="Measured Error Under Influence"
                  value={values.measured_error || ''}
                  onChange={(v) => setValue('measured_error', v)}
                  type="number"
                  step="any"
                  unit={instrument?.unit || 'kg'}
                  helpText="Enter the measured error under the specified environmental influence condition."
                />
              </div>
            )}

            {workflow === 'disturbance' && (
              <div className="sih-input-grid">
                <Field
                  label="Significant Fault Detected"
                  value={values.significant_fault || ''}
                  onChange={(v) => setValue('significant_fault', v)}
                  type="select"
                  options={[
                    { label: 'No — immunity requirement satisfied', value: 'false' },
                    { label: 'Yes — significant fault detected', value: 'true' },
                  ]}
                  helpText="Record whether the disturbance produced a significant fault."
                />
              </div>
            )}

            <label className="sih-field-label" style={{ marginTop: '14px' }}>
              <span>
                {workflow === 'inspection'
                  ? 'Inspection Notes'
                  : workflow === 'disturbance'
                    ? 'Disturbance Observations'
                    : workflow === 'influence'
                      ? 'Environmental Observations'
                      : 'Test Observations & Notes'}
              </span>
              <textarea
                value={values.notes || ''}
                onChange={(e) => setValue('notes', e.target.value)}
                placeholder="Enter test observations, conditions, or verification remarks..."
                className="sih-input-field"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </label>
          </div>
        )
      )}

      <div className="sih-form-execute-bar">
        <div className="sih-bar-left">
          {onPreviousTest && (
            <button
              type="button"
              className="sih-next-test-btn secondary"
              onClick={onPreviousTest}
            >
              ← PREVIOUS TEST
            </button>
          )}
          {onBackToProcedures && (
            <button
              type="button"
              className="sih-back-btn"
              onClick={onBackToProcedures}
            >
              BACK TO PROCEDURES
            </button>
          )}
        </div>

        <div className="sih-bar-center">
          <button
            type="button"
            className="sih-execute-button"
            disabled={disabled}
            onClick={execute}
          >
            {disabled ? (
              <span className="sih-exec-loading">
                <i className="sih-spinner" /> Evaluating test...
              </span>
            ) : (
              <span>EXECUTE TEST →</span>
            )}
          </button>
        </div>

        <div className="sih-bar-right">
          {onNextTest && (
            <button
              type="button"
              className="sih-next-test-btn secondary"
              onClick={onNextTest}
            >
              NEXT TEST →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
