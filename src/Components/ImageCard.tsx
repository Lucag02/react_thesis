import React from 'react';
import Card from 'react-bootstrap/Card';
import {Link} from "react-router-dom";

interface ImageCardProps {
    pathToImage: string;
    name?: string;
    onClickFunction?: ()=>void
}

function ImageCard({pathToImage, name = "Dataset", onClickFunction}: ImageCardProps) {
    return (
        <Card style={{width: '15rem', height: '15rem'}}>
            {!onClickFunction?(<Link to={`/canvas?image=${encodeURIComponent(pathToImage)}`} style={{textDecoration: 'none'}}>
                <Card.Img variant="top" src={pathToImage} height={'180rem'}/>
                <Card.Body>
                    <Card.Title style={{display: 'flex', justifyContent: 'center'}}>
                        {name}
                    </Card.Title>
                </Card.Body>
            </Link>):
                (<><Card.Img variant="top" src={pathToImage} height={'180rem'} onClick={onClickFunction}/><Card.Body>
                    <Card.Title style={{display: 'flex', justifyContent: 'center'}}>
                        {name}
                    </Card.Title>
                </Card.Body></>)}
        </Card>
    )
}

export default ImageCard