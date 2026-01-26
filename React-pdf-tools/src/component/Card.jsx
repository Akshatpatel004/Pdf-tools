
const Card = (props) => {
    return (
        <>
            <div className="card tool-card shadow-sm">
                <div className="card-body">
                    <img src={props.img} alt={props.title} className="tool-icon" />
                    <h5 className="card-title">{props.title}</h5>
                    <p className="card-text">{props.disc}</p>
                </div>
            </div>
        </>
    )
}

export default Card
