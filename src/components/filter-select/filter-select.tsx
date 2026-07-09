"use client"

type Option = {
    key: string,
    value: string,
}

interface FilterSelectProps {
    options: Option[],
    handleFilterSelection: Function,
    label: string,
}

export function FilterSelect({options, handleFilterSelection, label}: FilterSelectProps){
    return (
        <div>
            <label htmlFor="select-filter">{label}</label>
            <select name="select-filter" onChange={ (e) => handleFilterSelection(e)} >
                {options.map( (option: Option, index: number) => <option key={index}>{option.value}</option>)}
            </select>
        </div>
    )

}